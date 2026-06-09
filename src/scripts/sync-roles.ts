import AppDataSource from '../data-source';
import { CustomList } from '../entities/CustomList.entity';
import { ListInvitation } from '../entities/ListInvitation.entity';
import { CommunityMember } from '../entities/CommunityMember.entity';
import { InviteStatus, ListPermission, UserRole } from '../entities/types/enums';

async function syncRoles() {
  try {
    await AppDataSource.initialize();
    console.log('Database initialized.');

    const listRepo = AppDataSource.getRepository(CustomList);
    const invitationRepo = AppDataSource.getRepository(ListInvitation);
    const communityMemberRepo = AppDataSource.getRepository(CommunityMember);

    // Get all lists that have a communityId
    const lists = await listRepo.find();
    const listsWithChat = lists.filter((list) => list.settings && list.settings.communityId);
    console.log(`Found ${listsWithChat.length} lists with chat enabled.`);

    for (const list of listsWithChat) {
      const communityId = BigInt(list.settings!.communityId as string);

      // Get all accepted invitations for this list
      const invitations = await invitationRepo.find({
        where: {
          listId: list.id,
          status: InviteStatus.ACCEPTED,
        },
      });

      console.log(`Syncing roles for list ${list.name} (${invitations.length} members)...`);

      for (const inv of invitations) {
        const targetRole =
          inv.permission === ListPermission.EDITOR ? UserRole.MODERATOR : UserRole.MEMBER;

        // Update member in community
        const result = await communityMemberRepo.update(
          { communityId, userId: inv.inviteeId },
          { role: targetRole }
        );

        if (result.affected && result.affected > 0) {
          console.log(`- Updated user ${inv.inviteeId} to ${targetRole}`);
        }
      }
    }

    console.log('Role sync completed!');
  } catch (error) {
    console.error('Error syncing roles:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

syncRoles();
