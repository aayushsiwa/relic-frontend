import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '', // Not in central config: NEXT_PUBLIC_ envs must be read directly for frontend
});
