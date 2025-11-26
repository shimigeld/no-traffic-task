import ToastProvider, { useToast } from "@/components/Toast";
import { render, screen, waitFor } from "../test-utils";
import userEvent from "@testing-library/user-event";

const ToastTrigger = () => {
  const { pushToast } = useToast();
  return (
    <button
      onClick={() => pushToast({ open: true, message: "Hello toast", severity: "success" })}
    >
      Trigger Toast
    </button>
  );
};

describe("ToastProvider", () => {
  it("shows and hides toast messages", async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /trigger toast/i }));
    expect(screen.getByText("Hello toast")).toBeVisible();

    const closeButton = screen.getByRole("button", { name: /close/i });
    await userEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByText("Hello toast")).not.toBeInTheDocument();
    });
  });

  it("throws when hook used outside provider", () => {
    expect(() => render(<ToastTrigger />)).toThrow(/useToast must be used within a ToastProvider/);
  });
});
