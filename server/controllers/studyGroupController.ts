import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import {
  StudyGroupModel,
  UserModel,
  AppNotificationModel,
} from '../models/schemas.ts';

export const StudyGroupController = {
  // ─────────────────────────────────────────────────────
  // LIST
  // ─────────────────────────────────────────────────────
  async getGroups(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = req.query.campusId
      ? String(req.query.campusId)
      : undefined;
    const subject = req.query.subject ? String(req.query.subject) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const filter: any = {};

    if (requestedCampus && requestedCampus !== 'all') {
      filter.campusId = requestedCampus;
    } else if (req.user?.campusId) {
      filter.campusId = req.user.campusId;
    }

    let groups = await StudyGroupModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Fallback: if campus filter returned nothing, show all
    if (groups.length === 0 && !requestedCampus && req.user?.campusId) {
      groups = await StudyGroupModel.find({}).sort({ createdAt: -1 }).lean();
    }

    if (subject) {
      const s = subject.toLowerCase();
      groups = groups.filter((g: any) =>
        g.subject?.toLowerCase().includes(s)
      );
    }

    if (search) {
      const q = search.toLowerCase();
      groups = groups.filter(
        (g: any) =>
          g.name?.toLowerCase().includes(q) ||
          g.topic?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q)
      );
    }

    // ─── Compute per-user flags; strip joinRequests for non-creators ───
    const userId = req.user?.userId;
    const role = req.user?.role;

    const sanitized = groups.map((g: any) => {
      const isMember = (g.members || []).some((m: any) => m.userId === userId);
      const isCreator = g.creatorId === userId || role === 'admin';
      const myRequest = (g.joinRequests || []).find(
        (r: any) => r.userId === userId
      );

      return {
        ...g,
        // Only creator/admin sees the full list of pending requests
        joinRequests: isCreator ? g.joinRequests || [] : [],
        isMember,
        isCreator,
        myRequestStatus: myRequest?.status ?? null,
        pendingRequestsCount: isCreator
          ? (g.joinRequests || []).filter((r: any) => r.status === 'pending')
            .length
          : 0,
      };
    });

    res.json({ success: true, groups: sanitized });
  },

  // ─────────────────────────────────────────────────────
  // GET ONE
  // ─────────────────────────────────────────────────────
  async getGroupById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const group: any = await StudyGroupModel.findOne({ id }).lean();
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    const userId = req.user?.userId;
    const isCreator = group.creatorId === userId || req.user?.role === 'admin';
    const isMember = (group.members || []).some((m: any) => m.userId === userId);
    const myRequest = (group.joinRequests || []).find(
      (r: any) => r.userId === userId
    );

    res.json({
      success: true,
      group: {
        ...group,
        joinRequests: isCreator ? group.joinRequests || [] : [],
        isMember,
        isCreator,
        myRequestStatus: myRequest?.status ?? null,
      },
    });
  },

  // ─────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────
  async createGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      name,
      subject,
      topic,
      description,
      maxMembers = 10,
      type = 'public',
      locationType = 'Campus Library',
    } = req.body;

    if (!name?.trim() || !subject?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name and subject are required.',
      });
    }

    const user = await UserModel.findOne({ id: req.user.userId }).lean();
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    const newGroup = await StudyGroupModel.create({
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: user.campusId,
      creatorId: user.id,
      creatorName: user.name,
      creatorAvatar: user.avatar,
      name: name.trim(),
      subject: subject.trim(),
      topic: topic || 'Exam & Course Study',
      description: description || 'Collaborative campus study squad.',
      maxMembers: Number(maxMembers) || 10,
      type: type === 'private' ? 'private' : 'public',
      locationType: locationType || 'Campus Library',
      members: [
        {
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          role: 'admin',
          joinedAt: new Date().toISOString(),
        },
      ],
      schedule: [],
      resources: [],
      joinRequests: [],
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message:
        type === 'private'
          ? 'Private study squad created! Classmates must request permission before entering.'
          : 'New public study group created! Classmates can now join directly.',
      group: newGroup.toObject(),
    });
  },

  // ─────────────────────────────────────────────────────
  // JOIN — public = instant, private = request
  // ─────────────────────────────────────────────────────
  async joinGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const group = await StudyGroupModel.findOne({ id });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    const userId = String(req.user.userId);

    const isMember = group.members.some((m: any) => m.userId === userId);
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this study group.',
      });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'This study group has reached maximum member capacity.',
      });
    }

    const user = await UserModel.findOne({ id: userId }).lean();

    // ───── PRIVATE GROUP: require permission ─────
    if (group.type === 'private') {
      const existing = group.joinRequests.find((r: any) => r.userId === userId);

      if (existing && existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          message:
            'You have already requested permission to join this private group. Please wait for the group administrator to approve.',
        });
      }

      const message =
        typeof req.body?.message === 'string'
          ? req.body.message.trim().slice(0, 300)
          : 'Requested permission to enter private study group.';

      if (existing) {
        // Previously rejected — reset to pending with fresh message
        existing.status = 'pending';
        existing.message = message;
        existing.requestedAt = new Date().toISOString();
        existing.respondedAt = undefined;
      } else {
        group.joinRequests.push({
          id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId,
          userName: user?.name || req.user.name || 'Student',
          userAvatar: user?.avatar || '',
          collegeName: user?.collegeName || '',
          course: user?.course || '',
          message,
          status: 'pending',
          requestedAt: new Date().toISOString(),
        } as any);
      }
      await group.save();

      // Notify the group creator
      await AppNotificationModel.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        campusId: group.campusId,
        userId: group.creatorId,
        title: 'Private Group Join Request',
        message: `${user?.name || req.user.name
          } requested permission to enter your private group "${group.name}".`,
        type: 'group',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        requested: true,
        message:
          'Permission requested! The group creator has been notified to review your entry request.',
        group: group.toObject(),
      });
    }

    // ───── PUBLIC GROUP: instant join ─────
    group.members.push({
      userId,
      name: user?.name || req.user.name,
      avatar: user?.avatar || '',
      role: 'member',
      joinedAt: new Date().toISOString(),
    } as any);
    await group.save();

    res.json({
      success: true,
      joined: true,
      message: 'Joined study group!',
      group: group.toObject(),
    });
  },

  // ─────────────────────────────────────────────────────
  // CANCEL MY PENDING REQUEST (private group)
  // ─────────────────────────────────────────────────────
  async cancelJoinRequest(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const group = await StudyGroupModel.findOne({ id });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    const userId = String(req.user.userId);
    group.joinRequests = group.joinRequests.filter(
      (r: any) => !(r.userId === userId && r.status === 'pending')
    ) as any;
    await group.save();

    res.json({
      success: true,
      message: 'Join request cancelled.',
      group: group.toObject(),
    });
  },

  // ─────────────────────────────────────────────────────
  // CREATOR RESPONDS (approve / reject) — private groups
  // ─────────────────────────────────────────────────────
  async respondToJoinRequest(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const requestId = String(req.params.requestId);
    const { action } = req.body as { action: 'approve' | 'reject' };

    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({
        success: false,
        message: 'Action must be "approve" or "reject".',
      });
    }

    const group = await StudyGroupModel.findOne({ id });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    const isCreatorOrAdmin =
      group.creatorId === String(req.user.userId) ||
      group.members.some(
        (m: any) => m.userId === req.user!.userId && m.role === 'admin'
      ) ||
      req.user.role === 'admin';

    if (!isCreatorOrAdmin) {
      return res.status(403).json({
        success: false,
        message:
          'Only group administrators can approve or reject join requests.',
      });
    }

    const request = group.joinRequests.find((r: any) => r.id === requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: 'Join request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request is already ${request.status}.`,
      });
    }

    // ───── APPROVE ─────
    if (action === 'approve') {
      if (group.members.length >= group.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'This study group has reached maximum member capacity.',
        });
      }

      const alreadyMember = group.members.some(
        (m: any) => m.userId === request.userId
      );
      if (!alreadyMember) {
        group.members.push({
          userId: request.userId,
          name: request.userName,
          avatar: request.userAvatar || '',
          role: 'member',
          joinedAt: new Date().toISOString(),
        } as any);
      }

      request.status = 'approved';
      request.respondedAt = new Date().toISOString();
      await group.save();

      await AppNotificationModel.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        campusId: group.campusId,
        userId: request.userId,
        title: 'Group Join Request Approved!',
        message: `Your request to join "${group.name}" was approved! You can now participate in group discussions, access resources, and join study sessions.`,
        type: 'group',
        read: false,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        message: `Approved ${request.userName}'s request to join the squad!`,
        group: group.toObject(),
      });
    }

    // ───── REJECT ─────
    request.status = 'rejected';
    request.respondedAt = new Date().toISOString();
    await group.save();

    await AppNotificationModel.create({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      campusId: group.campusId,
      userId: request.userId,
      title: 'Group Join Request Update',
      message: `Your request to join "${group.name}" was declined by the group administrator.`,
      type: 'group',
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Declined ${request.userName}'s request.`,
      group: group.toObject(),
    });
  },

  // ─────────────────────────────────────────────────────
  // LEAVE
  // ─────────────────────────────────────────────────────
  async leaveGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const group = await StudyGroupModel.findOne({ id });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    group.members = group.members.filter(
      (m: any) => m.userId !== req.user!.userId
    ) as any;
    await group.save();

    res.json({
      success: true,
      message: 'Left study group.',
      group: group.toObject(),
    });
  },

  // ─────────────────────────────────────────────────────
  // RESOURCES
  // ─────────────────────────────────────────────────────
  async addResource(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const group = await StudyGroupModel.findOne({ id });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    const { title, url, type = 'pdf' } = req.body;
    if (!title?.trim())
      return res
        .status(400)
        .json({ success: false, message: 'Resource title required.' });

    const user = await UserModel.findOne({ id: req.user.userId }).lean();

    group.resources.unshift({
      id: `res_${Date.now()}`,
      title: title.trim(),
      url: url || 'https://example.com/shared-document.pdf',
      type: type || 'pdf',
      uploadedBy: user?.name || req.user.name,
      date: new Date().toISOString().split('T')[0],
    } as any);
    await group.save();

    res.json({
      success: true,
      message: 'Study resource shared with group.',
      group: group.toObject(),
    });
  },

  // ─────────────────────────────────────────────────────
  // SCHEDULE
  // ─────────────────────────────────────────────────────
  async addSchedule(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const group = await StudyGroupModel.findOne({ id });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    const { topic, date, time, location } = req.body;
    if (!topic || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Topic, date, and time are required.',
      });
    }

    group.schedule.push({
      id: `sch_${Date.now()}`,
      topic,
      date,
      time,
      location: location || group.locationType,
    } as any);
    await group.save();

    res.json({
      success: true,
      message: 'Study session scheduled.',
      group: group.toObject(),
    });
  },

  // ─────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────
  async deleteGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const group = await StudyGroupModel.findOne({ id }).lean();
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    if (group.creatorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the creator of this study group can delete it.',
      });
    }

    await StudyGroupModel.deleteOne({ id });
    res.json({ success: true, message: 'Study group deleted successfully.' });
  },
};