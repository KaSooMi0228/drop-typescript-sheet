import React from "react";
import { QuickCacheApi, useQuickCache } from "../clay/quick-cache";
import { WidgetStatus } from "../clay/widgets";

type OpenEffectConfig = {
    ready(cache: QuickCacheApi): boolean;
    required: boolean;
    activate(cache: QuickCacheApi): void;
};

export function useOpenEffect(status: WidgetStatus, config: OpenEffectConfig) {
    const cache = useQuickCache();
    const [activated, setActivated] = React.useState(false);
    const ready = config.ready(cache);

    React.useEffect(() => {
        if (!status.mutable || activated || !ready) {
            return;
        }
        setActivated(true);
        if (config.required) {
            config.activate(cache);
        }
    }, [activated, setActivated, ready, status.mutable]);
}
