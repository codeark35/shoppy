import api from '../../../shared/lib/api';
import type { UserProfile, UpdateProfileDto, CreateAddressDto, UpdateAddressDto, ChangePasswordDto } from '../types/account.types';

export const accountService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get('/users/me');
    return data.data;
  },

  async updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
    const { data } = await api.patch('/users/me', dto);
    return data.data;
  },

  async getAddresses() {
    const { data } = await api.get('/users/me/addresses');
    return data.data;
  },

  async createAddress(dto: CreateAddressDto) {
    const { data } = await api.post('/users/me/addresses', dto);
    return data.data;
  },

  async updateAddress(addressId: string, dto: UpdateAddressDto) {
    const { data } = await api.patch(`/users/me/addresses/${addressId}`, dto);
    return data.data;
  },

  async setDefaultAddress(addressId: string) {
    const { data } = await api.patch(`/users/me/addresses/${addressId}/default`);
    return data.data;
  },

  async deleteAddress(addressId: string): Promise<void> {
    await api.delete(`/users/me/addresses/${addressId}`);
  },

  async changePassword(dto: ChangePasswordDto) {
    const { data } = await api.patch('/users/me/change-password', dto);
    return data;
  },
};
