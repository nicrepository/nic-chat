// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {useIntl} from 'react-intl';

import nicLabsIcon from 'images/branding/niclito_chat.png';

type Props = {
    className?: string;
    width?: number;
    height?: number;
};

const MattermostLogo = ({className, width = 40, height = 40}: Props) => {
    const {formatMessage} = useIntl();

    return (
        <img
            className={className}
            src={nicLabsIcon}
            alt={formatMessage({id: 'generic_icons.mattermost', defaultMessage: 'Mattermost Logo'})}
            width={width}
            height={height}
            style={{display: 'block'}}
        />
    );
};

export default MattermostLogo;
