import { UseFlowsErrorScreen, UseFlowsScreen } from "./flows.provider.types";

export const ERROR_SCREEN: UseFlowsErrorScreen = async (input, err) => {
    console.log("Screen ERROR", input);
    console.error(err);
    return { screen: "ERROR", data: {} };
};

const EXAMPLE_SCREEN: UseFlowsScreen = async () => {
    return { screen: "EXAMPLE_SCREEN", data: { foo: "bar" } };
};

const SCREENS: Record<string, UseFlowsScreen> = {
    ERROR_SCREEN,
    EXAMPLE_SCREEN,
};

export function resolveScreen(screen: string): UseFlowsScreen {
    const screenFn = SCREENS[screen] || SCREENS.ERROR_SCREEN;
    return screenFn;
}
