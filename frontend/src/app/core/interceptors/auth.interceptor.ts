import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token');
    let clonedReq = req;

    if (token) {
        clonedReq = clonedReq.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    // App-wide cache buster: forces all GET requests to bypass browser 304 caching
    if (clonedReq.method === 'GET') {
        clonedReq = clonedReq.clone({
            params: clonedReq.params.set('_cb', Date.now().toString())
        });
    }

    return next(clonedReq);
};
