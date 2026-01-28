# Khanflow AWS Deployment Guide

Complete guide for deploying Khanflow to AWS with GitHub Actions CI/CD.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Infrastructure Setup](#aws-infrastructure-setup)
3. [GitHub Secrets Configuration](#github-secrets-configuration)
4. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
5. [Production Environment Variables](#production-environment-variables)
6. [Domain & DNS Setup](#domain--dns-setup)
7. [Post-Deployment](#post-deployment)
8. [Monitoring & Logs](#monitoring--logs)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with Actions enabled
- Supabase project (production database)
- Domain name (optional but recommended)
- OpenAI API key
- Google OAuth credentials
- Microsoft OAuth credentials

---

## AWS Infrastructure Setup

### Option 1: AWS ECS Fargate (Recommended - Serverless)

#### 1. Create ECR Repositories

```bash
# Install AWS CLI if not already installed
brew install awscli  # macOS
# or
pip install awscli

# Configure AWS CLI
aws configure
# Enter: Access Key ID, Secret Access Key, Region (e.g., us-east-1)

# Create ECR repositories
aws ecr create-repository --repository-name khanflow-backend --region us-east-1
aws ecr create-repository --repository-name khanflow-frontend --region us-east-1
```

**Note the repository URIs** (format: `123456789012.dkr.ecr.us-east-1.amazonaws.com/khanflow-backend`)

#### 2. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name khanflow-production --region us-east-1
```

Or via AWS Console:
1. Go to ECS → Clusters → Create Cluster
2. Choose "Networking only" (Fargate)
3. Name: `khanflow-production`
4. Create

#### 3. Set Up VPC and Security Groups

**Create Security Group for Backend:**
```bash
aws ec2 create-security-group \
  --group-name khanflow-backend-sg \
  --description "Security group for Khanflow backend" \
  --vpc-id <YOUR_VPC_ID>

# Allow traffic from Application Load Balancer
aws ec2 authorize-security-group-ingress \
  --group-id <BACKEND_SG_ID> \
  --protocol tcp \
  --port 8000 \
  --source-group <ALB_SG_ID>
```

**Create Security Group for Frontend:**
```bash
aws ec2 create-security-group \
  --group-name khanflow-frontend-sg \
  --description "Security group for Khanflow frontend" \
  --vpc-id <YOUR_VPC_ID>

# Allow traffic from Application Load Balancer
aws ec2 authorize-security-group-ingress \
  --group-id <FRONTEND_SG_ID> \
  --protocol tcp \
  --port 3000 \
  --source-group <ALB_SG_ID>
```

#### 4. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name khanflow-alb \
  --subnets <SUBNET_ID_1> <SUBNET_ID_2> \
  --security-groups <ALB_SG_ID> \
  --scheme internet-facing \
  --type application

# Create Target Groups
aws elbv2 create-target-group \
  --name khanflow-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id <YOUR_VPC_ID> \
  --target-type ip \
  --health-check-path /api/health

aws elbv2 create-target-group \
  --name khanflow-frontend-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id <YOUR_VPC_ID> \
  --target-type ip \
  --health-check-path /
```

#### 5. Create ECS Task Definitions

**Backend Task Definition** (`backend-task-definition.json`):
```json
{
  "family": "khanflow-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ECR_BACKEND_URI>:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "8000"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "OPENAI_API_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/khanflow-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**Frontend Task Definition** (`frontend-task-definition.json`):
```json
{
  "family": "khanflow-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "<ECR_FRONTEND_URI>:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "NEXT_PUBLIC_API_URL", "value": "https://api.yourdomain.com/api"},
        {"name": "NEXT_PUBLIC_APP_ORIGIN", "value": "https://yourdomain.com"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/khanflow-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definitions:
```bash
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
aws ecs register-task-definition --cli-input-json file://frontend-task-definition.json
```

#### 6. Create ECS Services

```bash
# Backend Service
aws ecs create-service \
  --cluster khanflow-production \
  --service-name khanflow-backend-service \
  --task-definition khanflow-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_IDS>],securityGroups=[<BACKEND_SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<BACKEND_TG_ARN>,containerName=backend,containerPort=8000"

# Frontend Service
aws ecs create-service \
  --cluster khanflow-production \
  --service-name khanflow-frontend-service \
  --task-definition khanflow-frontend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<SUBNET_IDS>],securityGroups=[<FRONTEND_SG_ID>],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<FRONTEND_TG_ARN>,containerName=frontend,containerPort=3000"
```

---

### Option 2: AWS EC2 with Docker Compose (Simpler but requires more management)

#### 1. Launch EC2 Instance

```bash
# Launch Ubuntu instance (t3.medium or larger recommended)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name <YOUR_KEY_PAIR> \
  --security-group-ids <SG_ID> \
  --subnet-id <SUBNET_ID> \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=khanflow-production}]'
```

#### 2. Connect and Install Docker

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@<INSTANCE_PUBLIC_IP>

# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker ubuntu

# Log out and log back in for group changes to take effect
exit
ssh -i your-key.pem ubuntu@<INSTANCE_PUBLIC_IP>
```

#### 3. Create docker-compose.yml on EC2

```yaml
version: '3.8'

services:
  backend:
    image: <ECR_BACKEND_URI>:latest
    ports:
      - "8000:8000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    restart: always

  frontend:
    image: <ECR_FRONTEND_URI>:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://<EC2_PUBLIC_IP>:8000/api
      NEXT_PUBLIC_APP_ORIGIN: http://<EC2_PUBLIC_IP>:3000
    restart: always
    depends_on:
      - backend
```

#### 4. Configure Nginx Reverse Proxy (Optional but recommended)

```bash
sudo apt-get install -y nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/khanflow
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/khanflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## GitHub Secrets Configuration

### 1. Add AWS Credentials

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### AWS Configuration
```
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
ECR_BACKEND_REPOSITORY=123456789012.dkr.ecr.us-east-1.amazonaws.com/khanflow-backend
ECR_FRONTEND_REPOSITORY=123456789012.dkr.ecr.us-east-1.amazonaws.com/khanflow-frontend
```

#### Production Database & Services
```
PROD_DATABASE_URL=postgresql://user:password@host.supabase.co:5432/postgres
PROD_SUPABASE_URL=https://yourproject.supabase.co
PROD_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PROD_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### API Keys
```
PROD_OPENAI_API_KEY=sk-...
PROD_JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### OAuth Credentials
```
PROD_GOOGLE_CLIENT_ID=123456789-...apps.googleusercontent.com
PROD_GOOGLE_CLIENT_SECRET=GOCSPX-...
PROD_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback

PROD_MICROSOFT_CLIENT_ID=...
PROD_MICROSOFT_CLIENT_SECRET=...
PROD_MICROSOFT_REDIRECT_URI=https://yourdomain.com/auth/microsoft/callback
```

#### Application URLs
```
PROD_FRONTEND_ORIGIN=https://yourdomain.com
PROD_FRONTEND_INTEGRATION_URL=https://yourdomain.com/integrations
PROD_NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
PROD_NEXT_PUBLIC_APP_ORIGIN=https://yourdomain.com
```

### 2. Create IAM User for GitHub Actions

```bash
# Create IAM user
aws iam create-user --user-name github-actions-khanflow

# Attach necessary policies
aws iam attach-user-policy \
  --user-name github-actions-khanflow \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-user-policy \
  --user-name github-actions-khanflow \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

# Create access key
aws iam create-access-key --user-name github-actions-khanflow
```

---

## CI/CD Pipeline Configuration

### Update `.github/workflows/ci-cd.yml`

Uncomment and configure the deployment section:

```yaml
  # Deploy to AWS
  deploy-aws:
    name: Deploy to AWS
    runs-on: ubuntu-latest
    needs: [build-images]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ secrets.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and Push Backend Image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: ${{ secrets.ECR_BACKEND_REPOSITORY }}:latest,${{ secrets.ECR_BACKEND_REPOSITORY }}:${{ github.sha }}

      - name: Build and Push Frontend Image
        uses: docker/build-push-action@v4
        with:
          context: ./new-frontend
          file: ./new-frontend/Dockerfile
          push: true
          tags: ${{ secrets.ECR_FRONTEND_REPOSITORY }}:latest,${{ secrets.ECR_FRONTEND_REPOSITORY }}:${{ github.sha }}
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.PROD_NEXT_PUBLIC_API_URL }}
            NEXT_PUBLIC_APP_ORIGIN=${{ secrets.PROD_NEXT_PUBLIC_APP_ORIGIN }}
            SUPABASE_URL=${{ secrets.PROD_SUPABASE_URL }}
            SUPABASE_SERVICE_ROLE_KEY=${{ secrets.PROD_SUPABASE_SERVICE_ROLE_KEY }}
            OPENAI_API_KEY=${{ secrets.PROD_OPENAI_API_KEY }}

      - name: Update ECS Backend Service
        run: |
          aws ecs update-service \
            --cluster khanflow-production \
            --service khanflow-backend-service \
            --force-new-deployment

      - name: Update ECS Frontend Service
        run: |
          aws ecs update-service \
            --cluster khanflow-production \
            --service khanflow-frontend-service \
            --force-new-deployment

      - name: Wait for Backend Deployment
        run: |
          aws ecs wait services-stable \
            --cluster khanflow-production \
            --services khanflow-backend-service

      - name: Wait for Frontend Deployment
        run: |
          aws ecs wait services-stable \
            --cluster khanflow-production \
            --services khanflow-frontend-service
```

---

## Production Environment Variables

### Backend Environment Variables

Create AWS Secrets Manager secrets for sensitive data:

```bash
aws secretsmanager create-secret \
  --name khanflow/prod/database-url \
  --secret-string "postgresql://user:pass@host:5432/db"

aws secretsmanager create-secret \
  --name khanflow/prod/jwt-secret \
  --secret-string "your-jwt-secret"

aws secretsmanager create-secret \
  --name khanflow/prod/openai-api-key \
  --secret-string "sk-..."
```

### Frontend Environment Variables

These are baked into the Docker image at build time via build args (see CI/CD section above).

---

## Domain & DNS Setup

### 1. Configure Route 53 (if using AWS for DNS)

```bash
# Create hosted zone
aws route53 create-hosted-zone --name yourdomain.com --caller-reference $(date +%s)

# Get ALB DNS name
aws elbv2 describe-load-balancers --names khanflow-alb --query 'LoadBalancers[0].DNSName'

# Create A record alias for main domain
# (Use AWS Console or CLI to create Route53 alias record pointing to ALB)
```

### 2. Configure SSL/TLS Certificate

```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS

# Follow validation instructions (add CNAME records to DNS)
# Wait for certificate to be validated

# Add HTTPS listener to ALB
aws elbv2 create-listener \
  --load-balancer-arn <ALB_ARN> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<CERT_ARN> \
  --default-actions Type=forward,TargetGroupArn=<FRONTEND_TG_ARN>
```

### 3. Configure ALB Listener Rules

```bash
# Route /api/* to backend target group
aws elbv2 create-rule \
  --listener-arn <HTTPS_LISTENER_ARN> \
  --priority 1 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=<BACKEND_TG_ARN>

# Route everything else to frontend target group (already default action)
```

---

## Post-Deployment

### 1. Update OAuth Redirect URIs

**Google Cloud Console:**
- Add `https://yourdomain.com/auth/google/callback`
- Add `https://yourdomain.com` to authorized origins

**Microsoft Azure Portal:**
- Add `https://yourdomain.com/auth/microsoft/callback`
- Add `https://yourdomain.com` to redirect URIs

### 2. Run Database Migrations

```bash
# Option 1: Run migration from local machine
DATABASE_URL=$PROD_DATABASE_URL npm run migration:run

# Option 2: SSH into EC2 and run
ssh ubuntu@<instance-ip>
docker exec -it <backend-container> npm run migration:run

# Option 3: Run as one-time ECS task
aws ecs run-task \
  --cluster khanflow-production \
  --task-definition khanflow-backend \
  --launch-type FARGATE \
  --overrides '{"containerOverrides":[{"name":"backend","command":["npm","run","migration:run"]}]}'
```

### 3. Verify Deployment

```bash
# Test backend health
curl https://api.yourdomain.com/api/health

# Test frontend
curl https://yourdomain.com

# Check ECS services
aws ecs describe-services \
  --cluster khanflow-production \
  --services khanflow-backend-service khanflow-frontend-service
```

### 4. Set Up Monitoring

```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name khanflow-backend-cpu-high \
  --alarm-description "Alert when backend CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=khanflow-production Name=ServiceName,Value=khanflow-backend-service
```

---

## Monitoring & Logs

### View Logs

**CloudWatch Logs:**
```bash
# Backend logs
aws logs tail /ecs/khanflow-backend --follow

# Frontend logs
aws logs tail /ecs/khanflow-frontend --follow
```

**EC2 Deployment:**
```bash
ssh ubuntu@<instance-ip>
docker logs -f <container-name>
```

### Key Metrics to Monitor

- **CPU Utilization**: Should stay below 70% under normal load
- **Memory Utilization**: Should stay below 80%
- **Request Count**: Track API requests
- **Error Rate**: Should be < 1%
- **Response Time**: p95 should be < 500ms
- **Database Connections**: Monitor active connections

---

## Troubleshooting

### Common Issues

#### 1. ECS Task Fails to Start

```bash
# Check task logs
aws ecs describe-tasks --cluster khanflow-production --tasks <TASK_ID>

# Check CloudWatch logs
aws logs get-log-events --log-group-name /ecs/khanflow-backend --log-stream-name <STREAM_NAME>
```

**Common causes:**
- Missing environment variables
- Database connection issues
- Port conflicts
- Image pull errors

#### 2. 502 Bad Gateway

- Check target group health checks
- Verify security group rules allow ALB → ECS traffic
- Check container logs for startup errors

#### 3. OAuth Redirect Issues

- Verify redirect URIs in OAuth provider console match production URLs
- Check CORS configuration in backend
- Ensure HTTPS is configured properly

#### 4. Database Connection Failures

```bash
# Test connection from ECS task
aws ecs execute-command \
  --cluster khanflow-production \
  --task <TASK_ID> \
  --container backend \
  --interactive \
  --command "/bin/sh"

# Inside container
npm run typeorm -- query "SELECT 1"
```

#### 5. Image Not Updating

```bash
# Force new deployment
aws ecs update-service \
  --cluster khanflow-production \
  --service khanflow-backend-service \
  --force-new-deployment

# Check task definition
aws ecs describe-task-definition --task-definition khanflow-backend
```

### Rollback Procedure

```bash
# Option 1: Rollback to previous task definition revision
aws ecs update-service \
  --cluster khanflow-production \
  --service khanflow-backend-service \
  --task-definition khanflow-backend:3  # Specify revision number

# Option 2: Rollback via GitHub
# Revert the commit and push to main - CI/CD will redeploy
git revert <commit-hash>
git push origin main
```

---

## Cost Optimization

### ECS Fargate Costs (Estimated)

- 2 backend tasks (0.5 vCPU, 1GB RAM): ~$30/month
- 2 frontend tasks (0.25 vCPU, 0.5GB RAM): ~$15/month
- ALB: ~$16/month
- Data transfer: Variable

**Total: ~$60-100/month**

### EC2 Cost (Estimated)

- t3.medium instance: ~$30/month
- Elastic IP: Free (if attached)
- Data transfer: Variable

**Total: ~$30-50/month**

### Cost Reduction Tips

1. Use AWS Savings Plans or Reserved Instances
2. Enable auto-scaling with min=1 during off-hours
3. Use Fargate Spot for non-critical tasks
4. Optimize Docker images (smaller = less pull time)
5. Enable ALB connection draining

---

## Next Steps

1. ✅ Verify CI/CD pipeline passes all checks
2. ⬜ Complete AWS infrastructure setup
3. ⬜ Configure GitHub Secrets
4. ⬜ Update CI/CD workflow with deployment steps
5. ⬜ Test deployment to staging environment first
6. ⬜ Configure custom domain and SSL
7. ⬜ Set up monitoring and alerts
8. ⬜ Create backup strategy
9. ⬜ Document runbook for operations team
10. ⬜ Perform load testing

---

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## Support

For issues or questions:
1. Check CloudWatch Logs
2. Review ECS task events
3. Verify security group rules
4. Check GitHub Actions logs
5. Review this guide's troubleshooting section

**Repository:** https://github.com/mashcodes10/khanflow
