import { Response } from 'express';
import { db } from '../config/db.ts';
import { AuthenticatedRequest } from '../middlewares/auth.ts';
import { StudyGroup, StudyGroupResource, StudyGroupSchedule } from '../models/types.ts';

export const StudyGroupController = {
  getGroups(req: AuthenticatedRequest, res: Response) {
    const requestedCampus = (req.query.campusId as string) || (req.user?.role === 'admin' ? (req.query.campusId as string) : undefined);
    const { subject, search } = req.query;

    let groups = [...db.studyGroups];

    if (requestedCampus && requestedCampus !== 'all') {
      groups = groups.filter(g => g.campusId === requestedCampus);
    } else if (req.user?.campusId) {
      const campusGroups = groups.filter(g => g.campusId === req.user?.campusId);
      if (campusGroups.length > 0) {
        groups = campusGroups;
      }
    }

    if (subject) {
      groups = groups.filter(g => g.subject.toLowerCase().includes((subject as string).toLowerCase()));
    }
    if (search) {
      const q = (search as string).toLowerCase();
      groups = groups.filter(g => g.name.toLowerCase().includes(q) || g.topic.toLowerCase().includes(q) || g.description.toLowerCase().includes(q));
    }

    res.json({ success: true, groups });
  },

  getGroupById(req: AuthenticatedRequest, res: Response) {
    const group = db.studyGroups.find(g => g.id === req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found.' });
    res.json({ success: true, group });
  },

  createGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, subject, topic, description, maxMembers = 10, type = 'public', locationType = 'Campus Library' } = req.body;
    if (!name?.trim() || !subject?.trim()) {
      return res.status(400).json({ success: false, message: 'Group name and subject are required.' });
    }

    const user = db.users.find(u => u.id === req.user?.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const newGroup: StudyGroup = {
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
          joinedAt: new Date().toISOString()
        }
      ],
      schedule: [],
      resources: [],
      createdAt: new Date().toISOString()
    };

    db.studyGroups.unshift(newGroup);

    res.status(201).json({ success: true, message: 'Study group formed successfully!', group: newGroup });
  },

  joinGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const group = db.studyGroups.find(g => g.id === req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found.' });

    const isMember = group.members.some(m => m.userId === req.user?.userId);
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this study group.' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ success: false, message: 'This study group has reached maximum member capacity.' });
    }

    const user = db.users.find(u => u.id === req.user?.userId);
    group.members.push({
      userId: req.user.userId,
      name: user?.name || req.user.name,
      avatar: user?.avatar || '',
      role: 'member',
      joinedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Joined study group!', group });
  },

  leaveGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const group = db.studyGroups.find(g => g.id === req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found.' });

    group.members = group.members.filter(m => m.userId !== req.user?.userId);

    res.json({ success: true, message: 'Left study group.', group });
  },

  addResource(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const group = db.studyGroups.find(g => g.id === req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found.' });

    const { title, url, type = 'pdf' } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'Resource title required.' });

    const user = db.users.find(u => u.id === req.user?.userId);
    const resource: StudyGroupResource = {
      id: `res_${Date.now()}`,
      title: title.trim(),
      url: url || 'https://example.com/shared-document.pdf',
      type: type || 'pdf',
      uploadedBy: user?.name || req.user.name,
      date: new Date().toISOString().split('T')[0]
    };

    group.resources.unshift(resource);

    res.json({ success: true, message: 'Study resource shared with group.', group });
  },

  addSchedule(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const group = db.studyGroups.find(g => g.id === req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Study group not found.' });

    const { topic, date, time, location } = req.body;
    if (!topic || !date || !time) {
      return res.status(400).json({ success: false, message: 'Topic, date, and time are required.' });
    }

    const sessionItem: StudyGroupSchedule = {
      id: `sch_${Date.now()}`,
      topic,
      date,
      time,
      location: location || group.locationType
    };

    group.schedule.push(sessionItem);

    res.json({ success: true, message: 'Study session scheduled.', group });
  },

  deleteGroup(req: AuthenticatedRequest, res: Response) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const groupIndex = db.studyGroups.findIndex(g => g.id === req.params.id);
    if (groupIndex === -1) {
      return res.status(404).json({ success: false, message: 'Study group not found.' });
    }

    const group = db.studyGroups[groupIndex];
    if (group.creatorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the creator of this study group can delete it.' });
    }

    db.studyGroups.splice(groupIndex, 1);
    res.json({ success: true, message: 'Study group deleted successfully.' });
  }
};
