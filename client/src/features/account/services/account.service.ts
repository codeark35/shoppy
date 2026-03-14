import api from '../../../shared/lib/api';
import type { UserProfile, UpdateProfileDto, CreateAddressDto } from '../types/account.types';

export const accountService = {
  async getProfile(): Promise<UserProfile> {
    const { data } = await api.get('/users/profile');
    return data.data;
  },

  async updateProfile(dto: UpdateProfileDto): Promise<UserProfile> {
    const { data } = await api.patch('/users/profile', dto);
    return data.data;
  },

  async getAddresses() {
    const { data } = await api.get('/users/addresses');
    return data.data;
  },

  async createAddress(dto: CreateAddressDto) {
    const { data } = await api.post('/users/addresses', dto);
    return data.data;
  },

  async deleteAddress(addressId: string): Promise<void> {
    await api.delete(`/users/addresses/${addressId}`);
  },
};
