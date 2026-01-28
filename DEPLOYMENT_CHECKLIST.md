# Production Deployment Checklist

Use this checklist before deploying KhanFlow to production.

## Pre-Deployment

### Code Quality
- [ ] All tests passing (backend and frontend)
- [ ] No console.log or debugging code
- [ ] TypeScript compilation successful (no errors)
- [ ] Linting passes without errors
- [ ] Code reviewed and approved

### Security
- [ ] All sensitive data in environment variables
- [ ] `.env` files not committed to Git
- [ ] `.env.example` files updated and documented
- [ ] Strong JWT secret generated (32+ characters)
- [ ] OAuth redirect URIs updated to production URLs
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### Database
- [ ] Supabase project created
- [ ] Database migrations run
- [ ] Connection pooling enabled (port 6543)
- [ ] Database credentials secured in AWS Secrets Manager (if using AWS)
- [ ] Backup strategy implemented
- [ ] Connection string format verified

### Environment Variables

#### Backend
- [ ] `NODE_ENV=production`
- [ ] `PORT` configured
- [ ] `DATABASE_URL` set (with connection pooling)
- [ ] `JWT_SECRET` generated and set
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set
- [ ] `GOOGLE_REDIRECT_URI` updated to production URL
- [ ] `MS_CLIENT_ID` and `MS_CLIENT_SECRET` set
- [ ] `MS_REDIRECT_URI` updated to production URL
- [ ] `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET` set (if using)
- [ ] `ZOOM_REDIRECT_URI` updated (if using)
- [ ] `FRONTEND_ORIGIN` set to production URL
- [ ] `FRONTEND_INTEGRATION_URL` set to production URL
- [ ] `OPENAI_API_KEY` set

#### Frontend
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_API_URL` set to production backend URL
- [ ] `NEXT_PUBLIC_APP_ORIGIN` set to production frontend URL
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set
- [ ] `NEXT_PUBLIC_MS_CLIENT_ID` set
- [ ] `NEXT_PUBLIC_MS_REDIRECT_URI` updated
- [ ] `JWT_SECRET` matches backend
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `SUPABASE_ANON_KEY` set
- [ ] `OPENAI_API_KEY` set

### OAuth Configuration

#### Google OAuth
- [ ] OAuth consent screen configured
- [ ] Authorized redirect URIs added in Google Console
- [ ] Scopes configured correctly
- [ ] Production domain added to authorized origins

#### Microsoft OAuth
- [ ] App registration created in Azure
- [ ] Redirect URIs configured
- [ ] API permissions granted
- [ ] Admin consent provided (if required)

### Infrastructure

#### Docker
- [ ] Dockerfiles tested locally
- [ ] Docker Compose configuration verified
- [ ] Health checks implemented
- [ ] Non-root user configured
- [ ] Multi-stage builds optimized

#### AWS (if using)
- [ ] AWS account and IAM user created
- [ ] ECR repositories created
- [ ] ECS cluster configured
- [ ] Task definitions created
- [ ] Load balancer configured
- [ ] Security groups configured
- [ ] Auto-scaling policies set
- [ ] CloudWatch logging enabled
- [ ] Secrets Manager configured
- [ ] SSL certificate obtained (ACM)

### Monitoring & Logging
- [ ] Application logging configured
- [ ] Error tracking set up
- [ ] Health check endpoints working
- [ ] Monitoring dashboards created
- [ ] Alerts configured
- [ ] Log retention policy set

### Performance
- [ ] Build optimizations enabled
- [ ] CDN configured (CloudFront or similar)
- [ ] Image optimization enabled
- [ ] Caching strategy implemented
- [ ] Database indexes created
- [ ] API response times acceptable
- [ ] Load testing completed

### Documentation
- [ ] README.md updated with production info
- [ ] API documentation current
- [ ] Deployment guide reviewed
- [ ] Runbook created for common issues
- [ ] Architecture diagram updated

## Deployment

### Pre-Flight
- [ ] Create deployment checklist ticket
- [ ] Schedule deployment window
- [ ] Notify stakeholders
- [ ] Backup current production data (if upgrading)
- [ ] Prepare rollback plan

### Deploy
- [ ] Deploy database migrations (if any)
- [ ] Deploy backend service
- [ ] Verify backend health checks
- [ ] Deploy frontend service
- [ ] Verify frontend health checks
- [ ] Test critical user flows
- [ ] Verify integrations working

### Post-Deployment
- [ ] Smoke tests passed
- [ ] Monitor error rates
- [ ] Check application logs
- [ ] Verify OAuth flows
- [ ] Test calendar sync
- [ ] Test voice assistant
- [ ] Monitor performance metrics
- [ ] Update DNS (if needed)
- [ ] Update documentation

## Post-Deployment Monitoring (First 24 Hours)

### Hour 1
- [ ] Monitor error rates
- [ ] Check application logs
- [ ] Verify user sign-ups
- [ ] Test critical features

### Hour 4
- [ ] Review performance metrics
- [ ] Check database connections
- [ ] Monitor API response times
- [ ] Review user feedback

### Hour 24
- [ ] Analyze error patterns
- [ ] Review usage statistics
- [ ] Check system resources
- [ ] Verify backup completion

## Rollback Plan

If issues are detected:

1. **Immediate Actions**
   - Stop new deployments
   - Assess severity
   - Communicate with team

2. **Rollback Steps**
   ```bash
   # Docker
   docker-compose down
   git checkout <previous-stable-tag>
   docker-compose up -d
   
   # AWS ECS
   aws ecs update-service --cluster khanflow-cluster \
     --service khanflow-backend-service \
     --task-definition khanflow-backend:<previous-revision>
   ```

3. **Post-Rollback**
   - Verify application functionality
   - Document issue
   - Plan fix and redeployment

## Support Contacts

- **Technical Lead**: [Name/Contact]
- **DevOps**: [Name/Contact]
- **Database Admin**: [Name/Contact]
- **On-Call**: [Schedule/Contact]

## Additional Resources

- [Deployment Documentation](docs/deployment/)
- [Troubleshooting Guide](docs/troubleshooting/)
- [Architecture Overview](docs/SUGGESTION_SYSTEM_ARCHITECTURE.md)

---

**Remember**: Never skip security checks. When in doubt, delay deployment.
