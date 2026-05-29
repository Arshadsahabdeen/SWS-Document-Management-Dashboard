import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import NotificationsPage from "../pages/NotificationsPage.jsx";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe("NotificationsPage", () => {
  it("renders notifications", () => {
    const notifications = [
      {
        _id: "n1",
        message: "Upload complete",
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      }
    ];

    render(
      <NotificationsPage
        notifications={notifications}
        isLoading={false}
        unreadCount={1}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText("Upload complete")).toBeInTheDocument();
  });

  it("displays unread badge", () => {
    const notifications = [
      {
        _id: "n1",
        message: "Upload complete",
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      }
    ];

    render(
      <NotificationsPage
        notifications={notifications}
        isLoading={false}
        unreadCount={1}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText(/1 unread/i)).toBeInTheDocument();
  });

  it("marks notification read", async () => {
    const onMarkRead = vi.fn().mockResolvedValue({});
    const notifications = [
      {
        _id: "n1",
        message: "Upload complete",
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      }
    ];

    render(
      <NotificationsPage
        notifications={notifications}
        isLoading={false}
        unreadCount={1}
        onMarkRead={onMarkRead}
        onMarkAllRead={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Mark Read/i }));

    expect(onMarkRead).toHaveBeenCalledWith("n1");
  });

  it("marks all notifications read", async () => {
    const onMarkAllRead = vi.fn().mockResolvedValue({});
    const notifications = [
      {
        _id: "n1",
        message: "Upload complete",
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      }
    ];

    render(
      <NotificationsPage
        notifications={notifications}
        isLoading={false}
        unreadCount={1}
        onMarkRead={vi.fn()}
        onMarkAllRead={onMarkAllRead}
        onRefresh={vi.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /Mark All Read/i }));

    expect(onMarkAllRead).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("All notifications marked as read");
  });

  it("handles empty state", () => {
    render(
      <NotificationsPage
        notifications={[]}
        isLoading={false}
        unreadCount={0}
        onMarkRead={vi.fn()}
        onMarkAllRead={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText(/No unread notifications/i)).toBeInTheDocument();
  });
});
