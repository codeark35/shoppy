export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  department: string;
  zipCode?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
  addresses: Address[];
}

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
}

export interface CreateAddressDto {
  label: string;
  street: string;
  city: string;
  department: string;
  zipCode?: string;
  isDefault?: boolean;
}
