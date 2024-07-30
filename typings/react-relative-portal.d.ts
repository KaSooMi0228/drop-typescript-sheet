declare module 'react-relative-portal' {
    import * as React from 'react'

    type RelativePortalProps = {
        component?: string;
        className?: string;
        top?: number;
        left?: number;
        fullWidth?: boolean;
    }

    class RelativePortal extends React.Component<RelativePortalProps> {
    }

    namespace RelativePortal {
    }
    export = RelativePortal
}
