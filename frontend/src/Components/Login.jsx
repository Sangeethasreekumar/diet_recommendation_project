import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [formData, setFormData] = useState({ name: "", password: "" });
  const [error, setError] = useState("");
  const [showSignUpButton, setShowSignUpButton] = useState(false); // State to toggle sign-up button visibility
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/login", formData);
      alert(res.data.message);

      // Store JWT token in localStorage
      localStorage.setItem("token", res.data.access_token);

      // Redirect to protected route (for example, the user's dashboard or landing page)
      navigate("/landing");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");

      // Show sign-up button if user is not found or credentials are invalid
      if (
        err.response?.data?.error === "User not found" ||
        err.response?.data?.error === "Invalid password"
      ) {
        setShowSignUpButton(true);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">Login</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          className="w-full p-2 border mb-2"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          className="w-full p-2 border mb-2"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Login
        </button>

        {/* Conditionally render the "Sign Up" button if the error occurs */}
        {showSignUpButton && (
          <div className="mt-4 text-center">
            <p>Do not have an account?</p>
            <button
              onClick={() => navigate("/signup")} // Redirect to the signup page
              className="text-blue-500 underline"
            >
              Sign Up
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;
