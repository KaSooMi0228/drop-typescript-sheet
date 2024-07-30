import * as React from "react";
import { useRecordQuery } from "../../clay/api";
import { useRecordContext } from "../../clay/widgets";
import { Payout, PAYOUT_META } from "./table";

export function usePreviousPayouts() {
    const payout = useRecordContext(PAYOUT_META);

    const [cachedPreviousPayouts, updatePreviousPayouts] = React.useState<
        Payout[]
    >([]);

    const previousPayouts = useRecordQuery(
        PAYOUT_META,
        {
            filters: [
                {
                    column: "project",
                    filter: {
                        equal: payout.project,
                    },
                },
                {
                    column: "number",
                    filter: {
                        lesser: payout.number.toString(),
                    },
                },
                {
                    column: "date",
                    filter: {
                        not_equal: null,
                    },
                },
            ],
        },
        [payout.project, payout.number]
    );

    React.useEffect(() => {
        if (previousPayouts) {
            updatePreviousPayouts(previousPayouts);
        }
    }, [previousPayouts]);

    return cachedPreviousPayouts;
}
