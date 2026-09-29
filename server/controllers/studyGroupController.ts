import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { StudyGroupModel, UserModel } from '../models/schemas.ts';

export const StudyGroupController = {
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

    res.json({ success: true, groups });
  },

  async getGroupById(req: AuthenticatedRequest, res: Response) {
    const id = String(req.params.id);
    const group = await StudyGroupModel.findOne({ id }).lean();
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });
    res.json({ success: true, group });
  },

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
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      message: 'Study group formed successfully!',
      group: newGroup.toObject(),
    });
  },

  async joinGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = String(req.params.id);
    const group = await StudyGroupModel.findOne({ id });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Study group not found.' });

    const isMember = group.members.some(
      (m: any) => m.userId === req.user!.userId
    );
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

    const user = await UserModel.findOne({ id: req.user.userId }).lean();

    group.members.push({
      userId: req.user.userId,
      name: user?.name || req.user.name,
      avatar: user?.avatar || '',
      role: 'member',
      joinedAt: new Date().toISOString(),
    } as any);
    await group.save();

    res.json({
      success: true,
      message: 'Joined study group!',
      group: group.toObject(),
    });
  },

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