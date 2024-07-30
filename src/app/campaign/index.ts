import { GridWithEditor } from "../../clay/dataGrid/gridWithEditor";
import CampaignWidget from "./CampaignWidget.widget";
import { Campaign } from "./table";

export const BrowseCampaigns = GridWithEditor({
    prefix: "#/campaigns",
    newTitle: "New Campaign",
    meta: CampaignWidget,
    makeContext: (context) => context,
    fallbackSorts: ["number"],
    title: (record: Campaign) => {
        return record.number + " " + record.name;
    },
    disableFinish: true,
});
