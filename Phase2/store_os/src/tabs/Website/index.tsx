import React from 'react';
import WebsiteActivities from '../../components/WebsiteActivities';

interface Props {
  onViewRateLock: (id: string) => void;
  onViewRateAlert: (id: string) => void;
}

const WebsiteTab: React.FC<Props> = ({ onViewRateLock, onViewRateAlert }) => {
  return (
    <WebsiteActivities onViewRateLock={onViewRateLock} onViewRateAlert={onViewRateAlert} />
  );
};

export default WebsiteTab;
