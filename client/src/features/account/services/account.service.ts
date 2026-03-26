import api from '../../../shared/lib/api';
import type { UserProfile, UpdateProfileDto, CreateAddressDto, UpdateAddressDto, ChangePasswordDto } from '../types/account.types';

export const accountService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get('/users/me');
    return data;
  },

  async updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
    const { data } = await api.patch('/users/me', dto);
    return data;
  },

  async getAddresses() {
    const { data } = await api.get('/users/me/addresses');
    return data;
  },

  async createAddress(dto: CreateAddressDto) {
    const { data } = await api.post('/users/me/addresses', dto);
    return data;
  },

  async updateAddress(addressId: string, dto: UpdateAddressDto) {
    const { data } = await api.patch(`/users/me/addresses/${addressId}`, dto);
    return data;
  },

  async setDefaultAddress(addressId: string) {
    const { data } = await api.patch(`/users/me/addresses/${addressId}/default`);
    return data;
  },

  async deleteAddress(addressId: string): Promise<void> {
    await api.delete(`/users/me/addresses/${addressId}`);
  },

  async changePassword(dto: ChangePasswordDto) {
    const { data } = await api.patch('/users/me/change-password', dto);
    return data;
  },
};
