import React from 'react';
import {Navigate,useSearchParams} from 'react-router-dom';
export default function Review(){const [params]=useSearchParams();return <Navigate replace to={'/my-booking?review='+encodeURIComponent(params.get('booking') || '')}/>;}
