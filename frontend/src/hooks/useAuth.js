import { useQuery } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import api from '../utils/api';


export const useAuth = () => {
    const dispatch = useDispatch();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['auth', 'profile'],
        queryFn: async () => {
            try {
                const response = await api.get('/user/profile');//prevent the issue since on every refresh rtk gets empty so call this 
                const userData = response.data.data.user;
                    dispatch(setCredentials(userData));
                return userData;
            } catch (error) {
                // If it fails (e.g. 401 Unauthorized), make sure Redux is cleared
                dispatch(setCredentials(null));
                throw error;
            }
        },
        retry: false, // Don't retry if not logged in
        staleTime: 6 * 60 * 1000, // 6 minutes before data is considered stale
    });

    return { isLoading, isError, user: data };
};
