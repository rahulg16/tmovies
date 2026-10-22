import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ErrorState from "./ErrorState";
import { renderWithProviders } from "../../../test-utils/renderWithProviders";

const renderErrorState = (props) =>
  renderWithProviders({
    ui: <ErrorState message="Something went wrong." {...props} />,
  });

const fontOf = (element) => window.getComputedStyle(element).fontFamily;

describe("the error state", () => {
  it("announces the message as an alert", () => {
    renderErrorState();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Something went wrong.");
  });

  it("offers no retry when it has nothing to retry", () => {
    renderErrorState();

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("retries when the retry button is pressed", async () => {
    const onRetry = jest.fn();

    renderErrorState({ onRetry });

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("labels the retry button as the caller asked", () => {
    renderErrorState({ onRetry: jest.fn(), retryLabel: "Reload" });

    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
  });

  it("disables the retry button while the retry is running", () => {
    const onRetry = jest.fn();

    renderErrorState({ onRetry, isRetrying: true });

    const button = screen.getByRole("button", { name: "Retrying..." });
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onRetry).not.toHaveBeenCalled();
  });

  it("gives the message and the retry button the font of the caller", () => {
    renderErrorState({
      onRetry: jest.fn(),
      sx: { fontFamily: "Verdana, Geneva, Tahoma, sans-serif" },
    });

    expect(fontOf(screen.getByRole("alert"))).toContain("Verdana");
    expect(fontOf(screen.getByRole("button", { name: "Try again" }))).toContain(
      "Verdana"
    );
  });

  it("keeps the theme font when the caller asks for none", () => {
    renderErrorState({ onRetry: jest.fn() });

    expect(fontOf(screen.getByRole("alert"))).not.toContain("Verdana");
  });

  it("hides the icon when it is not wanted", () => {
    const { container } = renderWithProviders({
      ui: <ErrorState message="Something went wrong." showIcon={false} />,
    });

    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });
});
