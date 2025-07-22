import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const navigate = useNavigate();
  return <RegisterForm onSuccess={() => {
    toast.success('Registration successful!');
    navigate('/dashboard');
  }} />;
} 