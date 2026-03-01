interface RegisterFormProps {
  onSuccess: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const handleRegister = () => {
    console.log("Registered");
    onSuccess();
  };

  return (
    <>
      <h2>Register</h2>
      <button onClick={handleRegister}>Register</button>
    </>
  );
}
