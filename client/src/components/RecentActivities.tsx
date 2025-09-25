import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  PersonAdd,
  Payment,
  Cancel,
  CardMembership,
} from '@mui/icons-material';

interface Activity {
  id: string;
  type: 'subscription' | 'cancellation' | 'payment' | 'user_joined';
  description: string;
  timestamp: string;
}

interface RecentActivitiesProps {
  activities: Activity[];
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'user_joined':
      return <PersonAdd color="primary" />;
    case 'payment':
      return <Payment color="success" />;
    case 'cancellation':
      return <Cancel color="error" />;
    case 'subscription':
      return <CardMembership color="info" />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'user_joined':
      return 'primary';
    case 'payment':
      return 'success';
    case 'cancellation':
      return 'error';
    case 'subscription':
      return 'info';
  }
};

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Activities
        </Typography>
        <List>
          {activities.map((activity) => (
            <ListItem key={activity.id} divider>
              <ListItemIcon>
                {getActivityIcon(activity.type)}
              </ListItemIcon>
              <ListItemText
                primary={activity.description}
                secondary={new Date(activity.timestamp).toLocaleString()}
              />
              <Chip
                label={activity.type.replace('_', ' ').toUpperCase()}
                size="small"
                color={getActivityColor(activity.type)}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};