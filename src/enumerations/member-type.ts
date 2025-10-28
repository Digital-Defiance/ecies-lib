/**
 * Types of members in the system.
 * 1. Admin - System administrators
 * 2. System - System services and automated processes
 * 3. User - Regular users
 * 4. Anonymous - Users who aren't logged in and un-owned data
 */
export enum MemberType {
  Admin = 'Admin',
  System = 'System',
  User = 'User',
  Anonymous = 'Anonymous',
}

/**
 * String union type for MemberType values.
 * Use this type when you need to extend with custom member types:
 * type CustomMemberType = MemberTypeValue | 'CustomType';
 */
export type MemberTypeValue = `${MemberType}`;

export default MemberType;
