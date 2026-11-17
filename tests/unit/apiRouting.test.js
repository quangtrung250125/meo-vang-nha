import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
const handlers=vi.hoisted(()=>({get:vi.fn(),add:vi.fn(),update:vi.fn(),remove:vi.fn(),reviews:vi.fn()}));
vi.mock('../../api/_lib/bookingsService.js',()=>({handleGetBookings:handlers.get,handleAddBooking:handlers.add,handleUpdateBooking:handlers.update,handleRemoveBooking:handlers.remove}));
vi.mock('../../api/_lib/reviewsHandler.js',()=>({handleReviews:handlers.reviews}));
import handler from '../../api/bookings/index.js';
const response=()=>({setHeader:vi.fn(),status:vi.fn().mockReturnThis(),end:vi.fn(),json:vi.fn()});
beforeEach(()=>vi.clearAllMocks());
describe('shared booking/review Function routing',()=>{
 it.each([['GET','get'],['POST','add'],['PUT','update'],['PATCH','update'],['DELETE','remove']])('keeps existing %s bookings behavior',async(method,name)=>{const req={method,url:'/api/bookings'},res=response();await handler(req,res);expect(handlers[name]).toHaveBeenCalledWith(req,res);expect(handlers.reviews).not.toHaveBeenCalled();});
 it.each(['list','public','submit','moderate'])('routes rewritten %s review requests to the authenticated review handler',async(action)=>{const req={method:action==='submit'||action==='moderate'?'POST':'GET',url:'/api/bookings',query:{reviewAction:action}},res=response();await handler(req,res);expect(handlers.reviews).toHaveBeenCalledWith(req,res,action);expect(handlers.get).not.toHaveBeenCalled();expect(handlers.add).not.toHaveBeenCalled();});
 it('supports local review requests through a query parameter',async()=>{const req={method:'POST',url:'/api/bookings?reviewAction=submit'},res=response();await handler(req,res);expect(handlers.reviews).toHaveBeenCalledWith(req,res,'submit');});
 it('handles OPTIONS before dispatching either service',async()=>{const res=response();await handler({method:'OPTIONS',url:'/api/bookings?reviewAction=submit'},res);expect(res.status).toHaveBeenCalledWith(200);expect(handlers.reviews).not.toHaveBeenCalled();});
 it('stays within the Vercel Hobby Function budget while preserving review URLs',()=>{const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.name.startsWith('_')?[]:entry.isDirectory()?walk(path.join(dir,entry.name)):/\.[jt]s$/.test(entry.name)?[path.join(dir,entry.name)]:[]);const entries=walk(path.resolve('api'));expect(entries.length).toBeGreaterThan(0);expect(entries.length).toBeLessThanOrEqual(12);const config=JSON.parse(fs.readFileSync('vercel.json','utf8'));expect(config.rewrites).toContainEqual({source:'/api/reviews/:action',destination:'/api/bookings?reviewAction=:action'});});
});
