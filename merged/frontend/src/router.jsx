import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Farming from './pages/Farming';
import Logistics from './pages/Logistics';
import ARField from './pages/ARField';
import Exchange from './pages/Exchange';

export const createRouter = (props) => createBrowserRouter([
    {
        path: '/',
        element: <RootLayout {...props} />,
        children: [
            {
                index: true,
                element: <Landing />,
            },
            {
                path: 'dashboard',
                element: <Dashboard />,
            },
            {
                path: 'farming',
                element: <Farming />,
            },
            {
                path: 'logistics',
                element: <Logistics />,
            },
            {
                path: 'ar',
                element: <ARField />,
            },
            {
                path: 'exchange',
                element: <Exchange />,
            },
        ],
    },
]);
