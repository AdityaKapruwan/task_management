import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './lib/db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Task from './models/Task.js';

async function main() {
  await connectDB();

  const adminPassword = await bcrypt.hash('admin123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  let admin = await User.findOne({ email: 'admin@team.com' });
  if (!admin) {
    admin = await User.create({
      email: 'admin@team.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    });
  }

  let member = await User.findOne({ email: 'member@team.com' });
  if (!member) {
    member = await User.create({
      email: 'member@team.com',
      password: memberPassword,
      name: 'Team Member',
      role: 'MEMBER',
    });
  }

  let project = await Project.findOne({ name: 'Website Redesign' });
  if (!project) {
    project = await Project.create({
      name: 'Website Redesign',
      description: 'Revamp company website with modern UI',
      creatorId: admin._id,
      memberIds: [admin._id, member._id],
    });
  }

  const taskCount = await Task.countDocuments({ projectId: project._id });
  if (taskCount === 0) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Task.insertMany([
      {
        title: 'Design homepage mockup',
        description: 'Create Figma designs for the new homepage',
        status: 'DONE',
        projectId: project._id,
        assigneeId: member._id,
        creatorId: admin._id,
        dueDate: yesterday,
      },
      {
        title: 'Implement navigation',
        description: 'Build responsive nav component',
        status: 'IN_PROGRESS',
        projectId: project._id,
        assigneeId: member._id,
        creatorId: admin._id,
        dueDate: tomorrow,
      },
      {
        title: 'Set up CI pipeline',
        description: 'Configure automated tests and deploy',
        status: 'TODO',
        projectId: project._id,
        assigneeId: admin._id,
        creatorId: admin._id,
        dueDate: yesterday,
      },
    ]);
  }

  console.log('Seed complete:');
  console.log('  Admin: admin@team.com / admin123');
  console.log('  Member: member@team.com / member123');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
