export type MemberStatus = 'pending' | 'active' | 'expired' | 'inactive'
export type MembershipType = 'Life' | 'Ordinary'
export type BusinessSize = 'Micro' | 'Small' | 'Medium'
export type AdminRole = 'president' | 'editor'
export type ActivityAction = 'approved' | 'rejected' | 'renewed' | 'upgraded' | 'edited' | 'synced'
export type DealStatus = 'active' | 'expired' | 'expiring'
export type AdStatus = 'active' | 'inactive'
export type EventAccess = 'open' | 'members_only'

export interface Member {
  id: string
  member_id: string
  auth_user_id: string | null
  full_name: string
  email: string
  phone: string | null
  business_name: string | null
  business_sector: string | null
  business_size: BusinessSize | null
  membership_type: MembershipType | null
  status: MemberStatus
  member_since: string | null
  expiry_date: string | null
  payment_ref: string | null
  ic_number: string | null
  ssm_reg_no: string | null
  business_address: string | null
  sector_category: string | null
  rep_name: string | null
  rep_ic: string | null
  rep_phone: string | null
  updated_at: string
  created_at: string
}

export interface AdminUser {
  id: string
  auth_user_id: string
  full_name: string
  email: string
  role: AdminRole
  created_at: string
}

export interface Event {
  id: string
  title: string
  venue: string | null
  event_date: string
  access_type: EventAccess
  registered_count: number
  description: string | null
  created_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  member_id: string
  registered_at: string
}

export interface Deal {
  id: string
  merchant_name: string
  offer_description: string | null
  category: string | null
  discount_value: string | null
  valid_until: string | null
  status: DealStatus
  created_at: string
}

export interface Advertisement {
  id: string
  advertiser_name: string
  headline: string
  image_url: string | null
  period_start: string | null
  period_end: string | null
  click_count: number
  status: AdStatus
  description: string | null
  link_url: string | null
  bg_color: string | null
  created_at: string
}

export type AnnouncementStatus = 'draft' | 'published' | 'scheduled'

export interface Announcement {
  id: string
  title: string
  body: string
  status: AnnouncementStatus
  published_at: string | null
  scheduled_for: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  member_id: string | null
  admin_id: string | null
  action: ActivityAction
  details: string | null
  payment_ref: string | null
  created_at: string
  members?: Pick<Member, 'full_name' | 'member_id'>
  admin_users?: Pick<AdminUser, 'full_name' | 'role'>
}
