import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import UploadPage from "../pages/UploadPage.jsx";
import toast from "react-hot-toast";
import { uploadDocuments } from "../services/api.js";

vi.mock("../services/api.js", () => ({
  uploadDocuments: vi.fn()
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe("UploadPage", () => {
  beforeEach(() => {
    uploadDocuments.mockReset();
    toast.error.mockReset();
    toast.success.mockReset();
  });

  it("renders upload area", () => {
    render(<UploadPage />);

    expect(screen.getByText(/Drop PDF files here/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Choose PDF files/i })).toBeInTheDocument();
  });

  it("allows PDF selection", async () => {
    render(<UploadPage />);

    const input = document.querySelector("input[type='file']");
    const pdfFile = new File(["%PDF"], "sample.pdf", { type: "application/pdf" });

    await userEvent.upload(input, pdfFile);

    expect(screen.getByText("sample.pdf")).toBeInTheDocument();
    expect(screen.getByText(/1 file selected/i)).toBeInTheDocument();
  });

  it("rejects invalid file types", async () => {
    render(<UploadPage />);

    const input = document.querySelector("input[type='file']");
    const badFile = new File(["text"], "notes.txt", { type: "text/plain" });

    await userEvent.upload(input, badFile);

    expect(toast.error).toHaveBeenCalledWith("Only PDF files are allowed");
    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();
  });

  it("displays selected file", async () => {
    render(<UploadPage />);

    const input = document.querySelector("input[type='file']");
    const pdfFile = new File(["%PDF"], "quarterly.pdf", { type: "application/pdf" });

    await userEvent.upload(input, pdfFile);

    expect(screen.getByText("quarterly.pdf")).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it("displays upload progress", async () => {
    render(<UploadPage />);

    const input = document.querySelector("input[type='file']");
    const data = new Uint8Array(2000);
    const pdfFile = new File([data], "progress.pdf", { type: "application/pdf" });

    await userEvent.upload(input, pdfFile);

    uploadDocuments.mockImplementation(async (_formData, onUploadProgress) => {
      onUploadProgress({ loaded: 1000 });
      return { data: { count: 1 } };
    });

    await userEvent.click(screen.getByRole("button", { name: /Upload Files/i }));

    expect(screen.getByText(/50%/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/100%/i)).toBeInTheDocument();
    });
  });

  it("displays upload status", async () => {
    render(<UploadPage />);

    const input = document.querySelector("input[type='file']");
    const pdfFile = new File(["%PDF"], "status.pdf", { type: "application/pdf" });

    await userEvent.upload(input, pdfFile);

    uploadDocuments.mockResolvedValue({ data: { count: 1 } });

    await userEvent.click(screen.getByRole("button", { name: /Upload Files/i }));

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalled();
    });
  });
});
