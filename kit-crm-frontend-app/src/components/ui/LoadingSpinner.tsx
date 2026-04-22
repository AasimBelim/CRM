import { Spinner } from "reactstrap";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  fullscreen?: boolean;
  text?: string;
}

const sizeMap = {
  sm: "",
  md: "spinner-border",
  lg: "spinner-border-lg",
};

const LoadingSpinner = ({
  size = "md",
  color = "primary",
  fullscreen = false,
  text,
}: LoadingSpinnerProps) => {
  const spinner = (
    <div className="text-center">
      <Spinner
        color={color}
        size={size === "sm" ? "sm" : undefined}
        className={size === "lg" ? sizeMap.lg : ""}
      />
      {text && <p className="mt-2 text-muted">{text}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        className="d-flex align-items-center justify-content-center position-fixed top-0 start-0 w-100 h-100"
        style={{ backgroundColor: "rgba(255,255,255,0.8)", zIndex: 9999 }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
