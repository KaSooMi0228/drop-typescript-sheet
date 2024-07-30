import { Link } from "../../../clay/link";
import { RecordMeta } from "../../../clay/meta";
import { genUUID, UUID } from "../../../clay/uuid";
import { Version } from "../../../clay/version";
import { DetailSheetOption } from "../../project/detail-sheet/table";
import { QuotationOption } from "../table";

//!Data
export type Note = {
    title: string;
    include: boolean;
    options: Link<QuotationOption | DetailSheetOption>[] | null;
    content: string;
};

//!Data
export type NoteList = {
    name: string;
    options: Link<QuotationOption | DetailSheetOption>[] | null;
    notes: Note[];
};

//!Data
export type ScopeOfWork = {
    id: UUID;
    recordVersion: Version;
    notes: NoteList;
    contractNotes: Link<ContractNote>[];
    projectSpotlight: Link<ProjectSpotlight>[];
};

//!Data
export type ContractNote = {
    id: UUID;
    recordVersion: Version;
    notes: NoteList;
};

//!Data
export type ProjectSpotlight = {
    id: UUID;
    recordVersion: Version;
    notes: NoteList;
};

// BEGIN MAGIC -- DO NOT EDIT
export type NoteJSON = {
    title: string;
    include: boolean;
    options: (string | null)[] | null;
    content: string;
};

export function JSONToNote(json: NoteJSON): Note {
    return {
        title: json.title,
        include: json.include,
        options:
            json.options === null ? null : json.options.map((inner) => inner),
        content: json.content,
    };
}
export type NoteBrokenJSON = {
    title?: string;
    include?: boolean;
    options?: (string | null)[] | null;
    content?: string;
};

export function newNote(): Note {
    return JSONToNote(repairNoteJSON(undefined));
}
export function repairNoteJSON(json: NoteBrokenJSON | undefined): NoteJSON {
    if (json) {
        return {
            title: json.title || "",
            include: json.include || false,
            options: Array.isArray(json.options)
                ? (json.options || []).map((inner) => inner || null)
                : null,
            content: json.content || "",
        };
    } else {
        return {
            title: undefined || "",
            include: undefined || false,
            options: Array.isArray(undefined)
                ? (undefined || []).map((inner) => inner || null)
                : null,
            content: undefined || "",
        };
    }
}

export function NoteToJSON(value: Note): NoteJSON {
    return {
        title: value.title,
        include: value.include,
        options:
            value.options === null ? null : value.options.map((inner) => inner),
        content: value.content,
    };
}

export const NOTE_META: RecordMeta<Note, NoteJSON, NoteBrokenJSON> & {
    name: "Note";
} = {
    name: "Note",
    type: "record",
    repair: repairNoteJSON,
    toJSON: NoteToJSON,
    fromJSON: JSONToNote,
    fields: {
        title: { type: "string" },
        include: { type: "boolean" },
        options: {
            type: "array?",
            items: {
                type: "uuid",
                linkTo: "QuotationOption | DetailSheetOption>[] | n",
            },
        },
        content: { type: "string" },
    },
    userFacingKey: "title",
    functions: {},
    segments: {},
};

export type NoteListJSON = {
    name: string;
    options: (string | null)[] | null;
    notes: NoteJSON[];
};

export function JSONToNoteList(json: NoteListJSON): NoteList {
    return {
        name: json.name,
        options:
            json.options === null ? null : json.options.map((inner) => inner),
        notes: json.notes.map((inner) => JSONToNote(inner)),
    };
}
export type NoteListBrokenJSON = {
    name?: string;
    options?: (string | null)[] | null;
    notes?: NoteJSON[];
};

export function newNoteList(): NoteList {
    return JSONToNoteList(repairNoteListJSON(undefined));
}
export function repairNoteListJSON(
    json: NoteListBrokenJSON | undefined
): NoteListJSON {
    if (json) {
        return {
            name: json.name || "",
            options: Array.isArray(json.options)
                ? (json.options || []).map((inner) => inner || null)
                : null,
            notes: (json.notes || []).map((inner) => repairNoteJSON(inner)),
        };
    } else {
        return {
            name: undefined || "",
            options: Array.isArray(undefined)
                ? (undefined || []).map((inner) => inner || null)
                : null,
            notes: (undefined || []).map((inner) => repairNoteJSON(inner)),
        };
    }
}

export function NoteListToJSON(value: NoteList): NoteListJSON {
    return {
        name: value.name,
        options:
            value.options === null ? null : value.options.map((inner) => inner),
        notes: value.notes.map((inner) => NoteToJSON(inner)),
    };
}

export const NOTE_LIST_META: RecordMeta<
    NoteList,
    NoteListJSON,
    NoteListBrokenJSON
> & { name: "NoteList" } = {
    name: "NoteList",
    type: "record",
    repair: repairNoteListJSON,
    toJSON: NoteListToJSON,
    fromJSON: JSONToNoteList,
    fields: {
        name: { type: "string" },
        options: {
            type: "array?",
            items: {
                type: "uuid",
                linkTo: "QuotationOption | DetailSheetOption>[] | n",
            },
        },
        notes: { type: "array", items: NOTE_META },
    },
    userFacingKey: "name",
    functions: {},
    segments: {},
};

export type ScopeOfWorkJSON = {
    id: string;
    recordVersion: number | null;
    notes: NoteListJSON;
    contractNotes: (string | null)[];
    projectSpotlight: (string | null)[];
};

export function JSONToScopeOfWork(json: ScopeOfWorkJSON): ScopeOfWork {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        notes: JSONToNoteList(json.notes),
        contractNotes: json.contractNotes.map((inner) => inner),
        projectSpotlight: json.projectSpotlight.map((inner) => inner),
    };
}
export type ScopeOfWorkBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    notes?: NoteListJSON;
    contractNotes?: (string | null)[];
    projectSpotlight?: (string | null)[];
};

export function newScopeOfWork(): ScopeOfWork {
    return JSONToScopeOfWork(repairScopeOfWorkJSON(undefined));
}
export function repairScopeOfWorkJSON(
    json: ScopeOfWorkBrokenJSON | undefined
): ScopeOfWorkJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            notes: repairNoteListJSON(json.notes),
            contractNotes: (json.contractNotes || []).map(
                (inner) => inner || null
            ),
            projectSpotlight: (json.projectSpotlight || []).map(
                (inner) => inner || null
            ),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            notes: repairNoteListJSON(undefined),
            contractNotes: (undefined || []).map((inner) => inner || null),
            projectSpotlight: (undefined || []).map((inner) => inner || null),
        };
    }
}

export function ScopeOfWorkToJSON(value: ScopeOfWork): ScopeOfWorkJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        notes: NoteListToJSON(value.notes),
        contractNotes: value.contractNotes.map((inner) => inner),
        projectSpotlight: value.projectSpotlight.map((inner) => inner),
    };
}

export const SCOPE_OF_WORK_META: RecordMeta<
    ScopeOfWork,
    ScopeOfWorkJSON,
    ScopeOfWorkBrokenJSON
> & { name: "ScopeOfWork" } = {
    name: "ScopeOfWork",
    type: "record",
    repair: repairScopeOfWorkJSON,
    toJSON: ScopeOfWorkToJSON,
    fromJSON: JSONToScopeOfWork,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        notes: NOTE_LIST_META,
        contractNotes: {
            type: "array",
            items: { type: "uuid", linkTo: "ContractNote" },
        },
        projectSpotlight: {
            type: "array",
            items: { type: "uuid", linkTo: "ProjectSpotlight" },
        },
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ContractNoteJSON = {
    id: string;
    recordVersion: number | null;
    notes: NoteListJSON;
};

export function JSONToContractNote(json: ContractNoteJSON): ContractNote {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        notes: JSONToNoteList(json.notes),
    };
}
export type ContractNoteBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    notes?: NoteListJSON;
};

export function newContractNote(): ContractNote {
    return JSONToContractNote(repairContractNoteJSON(undefined));
}
export function repairContractNoteJSON(
    json: ContractNoteBrokenJSON | undefined
): ContractNoteJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            notes: repairNoteListJSON(json.notes),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            notes: repairNoteListJSON(undefined),
        };
    }
}

export function ContractNoteToJSON(value: ContractNote): ContractNoteJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        notes: NoteListToJSON(value.notes),
    };
}

export const CONTRACT_NOTE_META: RecordMeta<
    ContractNote,
    ContractNoteJSON,
    ContractNoteBrokenJSON
> & { name: "ContractNote" } = {
    name: "ContractNote",
    type: "record",
    repair: repairContractNoteJSON,
    toJSON: ContractNoteToJSON,
    fromJSON: JSONToContractNote,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        notes: NOTE_LIST_META,
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

export type ProjectSpotlightJSON = {
    id: string;
    recordVersion: number | null;
    notes: NoteListJSON;
};

export function JSONToProjectSpotlight(
    json: ProjectSpotlightJSON
): ProjectSpotlight {
    return {
        id: { uuid: json.id },
        recordVersion: { version: json.recordVersion },
        notes: JSONToNoteList(json.notes),
    };
}
export type ProjectSpotlightBrokenJSON = {
    id?: string;
    recordVersion?: number | null;
    notes?: NoteListJSON;
};

export function newProjectSpotlight(): ProjectSpotlight {
    return JSONToProjectSpotlight(repairProjectSpotlightJSON(undefined));
}
export function repairProjectSpotlightJSON(
    json: ProjectSpotlightBrokenJSON | undefined
): ProjectSpotlightJSON {
    if (json) {
        return {
            id: json.id || genUUID(),
            recordVersion:
                json.recordVersion === undefined ? null : json.recordVersion,
            notes: repairNoteListJSON(json.notes),
        };
    } else {
        return {
            id: undefined || genUUID(),
            recordVersion: null,
            notes: repairNoteListJSON(undefined),
        };
    }
}

export function ProjectSpotlightToJSON(
    value: ProjectSpotlight
): ProjectSpotlightJSON {
    return {
        id: value.id.uuid,
        recordVersion: value.recordVersion.version,
        notes: NoteListToJSON(value.notes),
    };
}

export const PROJECT_SPOTLIGHT_META: RecordMeta<
    ProjectSpotlight,
    ProjectSpotlightJSON,
    ProjectSpotlightBrokenJSON
> & { name: "ProjectSpotlight" } = {
    name: "ProjectSpotlight",
    type: "record",
    repair: repairProjectSpotlightJSON,
    toJSON: ProjectSpotlightToJSON,
    fromJSON: JSONToProjectSpotlight,
    fields: {
        id: { type: "uuid" },
        recordVersion: { type: "version" },
        notes: NOTE_LIST_META,
    },
    userFacingKey: null,
    functions: {},
    segments: {},
};

// END MAGIC -- DO NOT EDIT
