import { AdminAction, TrivialAction } from './policy.service';

export class CreateClub extends TrivialAction {}
export class ReadClub extends TrivialAction {}
export class UpdateClub extends AdminAction {}
export class DeleteClub extends AdminAction {}

export class ReadApplication extends AdminAction {}
export class DecideApplication extends AdminAction {}

export class ReadMemberInfo extends AdminAction {}
export class UpdateMemberPrivilege extends AdminAction {}
export class KickMember extends AdminAction {}
