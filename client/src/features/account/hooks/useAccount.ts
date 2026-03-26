import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/account.service';
import type { UpdateProfileDto, CreateAddressDto, UpdateAddressDto, ChangePasswordDto } from '../types/account.types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: accountService.getProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => accountService.updateProfile(dto),
    onSuccess: (updatedProfile) => {
      // Actualizar el cache directamente con la respuesta del servidor
      // para que los datos sean visibles inmediatamente sin necesidad de refetch
      queryClient.setQueryData(['profile'], updatedProfile);
    },
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: accountService.getAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAddressDto) => accountService.createAddress(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAddressDto }) =>
      accountService.updateAddress(id, dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.setDefaultAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountService.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDto) => accountService.changePassword(dto),
  });
}
