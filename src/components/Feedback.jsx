export default function Feedback({ children, error = false }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl p-4 text-sm ${error ? "feedback-error" : "feedback-notice"}`}
    >
      {children}
    </p>
  );
}
