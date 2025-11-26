import { render } from "@testing-library/react";
import type { ReactElement } from "react";

const customRender = (ui: ReactElement, options?: Parameters<typeof render>[1]) => render(ui, options);

export * from "@testing-library/react";
export { customRender as render };
