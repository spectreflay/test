import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LogIn } from "lucide-react";
import { useLoginMutation } from "../store/services/authService";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";
import { RootState } from "../store";
import UnverifiedEmailAlert from "../components/auth/UnverifiedEmailAlert";

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);

  // Redirect if already logged in and email is verified
  useEffect(() => {
    if (token && user?.isEmailVerified) {
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [token, user?.isEmailVerified, navigate, location]);

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await login(data).unwrap();
      dispatch(setCredentials(response));

      if (!response.isEmailVerified) {
        setIsEmailUnverified(true);
        toast.error("Please verify your email address");
        return;
      }

      toast.success("Login successful!");
      const from = (location.state as any)?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (error) {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        {isEmailUnverified && <UnverifiedEmailAlert />}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register("password", { required: "Password is required" })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center items-center">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
            <p>or</p>
            <Link to="/staff/login" className="text-primary">
              Staff login
            </Link>
          </div>
        </form>
        <div className="flex justify-between text-sm text-gray-600 mt-4">
          <Link to="/forgot-password" className="hover:underline">
            Forgot your password?
          </Link>
          <Link to="/register" className="hover:underline">
            Don't have an account? Signup
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;