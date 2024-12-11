import React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { User } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useUpdateProfileMutation } from '../../store/services/userService';
import UserAvatar from '../profile/UserAvatar';
import { setCredentials } from '../../store/slices/authSlice';

interface ProfileForm {
  name: string;
  email: string;
}

const Profile = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [updateProfile] = useUpdateProfileMutation();
  const dispatch = useDispatch();

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      const result = await updateProfile(data).unwrap();
      dispatch(setCredentials({ ...result }));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <UserAvatar
          name={user?.name || ''}
          size="lg"
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border-primary focus:ring-primary"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
