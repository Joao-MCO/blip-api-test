/* eslint-disable @typescript-eslint/no-explicit-any */

export type FlowsData = {
    [key: string]: unknown;
};

export type UseFlowsInput = {
    screen: string;
    data: FlowsData;
    version: string;
    action: string;
    flow_token: string;
};

export type UseFlowsOutput = { screen: string; data: Record<string, any> };

export type UseFlowsScreen = (input: UseFlowsInput) => Promise<UseFlowsOutput>;

export type UseFlowsErrorScreen = (input: UseFlowsInput, err?: Error) => Promise<UseFlowsOutput>;
