# AWS Deployment Guide

This guide covers deploying KhanFlow to AWS using various services.

## Architecture Overview

Recommended AWS architecture:
- **Frontend**: AWS Amplify or EC2 with Nginx
- **Backend**: AWS ECS (Elastic Container Service) or EC2
- **Database**: Supabase (external) or AWS RDS
- **Storage**: AWS S3 (for assets)
- **CDN**: AWS CloudFront
- **Load Balancer**: AWS ALB (Application Load Balancer)

## Prerequisites

- AWS Account
- AWS CLI configured
- Docker installed
- Supabase database set up
- Domain name (optional but recommended)

## Option 1: AWS Elastic Beanstalk (Simplest)

### Setup

1. **Install EB CLI:**
```bash
pip install awsebcli
```

2. **Initialize Elastic Beanstalk:**
```bash
cd backend
eb init -p docker khanflow-backend --region us-east-1

cd ../new-frontend
eb init -p docker khanflow-frontend --region us-east-1
```

3. **Create Environment:**
```bash
# Backend
cd backend
eb create khanflow-backend-prod

# Frontend
cd ../new-frontend
eb create khanflow-frontend-prod
```

4. **Set Environment Variables:**
```bash
# Backend
eb setenv NODE_ENV=production \
  DATABASE_URL="your_supabase_url" \
  JWT_SECRET="your_secret" \
  GOOGLE_CLIENT_ID="your_id" \
  GOOGLE_CLIENT_SECRET="your_secret" \
  # ... add all other env vars

# Frontend
eb setenv NODE_ENV=production \
  NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api" \
  # ... add all other env vars
```

5. **Deploy:**
```bash
# Backend
cd backend
eb deploy

# Frontend
cd ../new-frontend
eb deploy
```

## Option 2: AWS ECS with Fargate (Production-Ready)

### 1. Push Images to ECR

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Create repositories
aws ecr create-repository --repository-name khanflow-backend
aws ecr create-repository --repository-name khanflow-frontend

# Build and push backend
cd backend
docker build -t khanflow-backend .
docker tag khanflow-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/khanflow-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/khanflow-backend:latest

# Build and push frontend
cd ../new-frontend
docker build -t khanflow-frontend .
docker tag khanflow-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/khanflow-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/khanflow-frontend:latest
```

### 2. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name khanflow-cluster --region us-east-1
```

### 3. Create Task Definitions

Create `backend-task-definition.json`:
```json
{
  "family": "khanflow-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/khanflow-backend:latest",
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
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
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

Register task definition:
```bash
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
```

### 4. Create Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name khanflow-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target groups
aws elbv2 create-target-group \
  --name khanflow-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxx \
  --target-type ip

# Create listeners
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

### 5. Create ECS Service

```bash
aws ecs create-service \
  --cluster khanflow-cluster \
  --service-name khanflow-backend-service \
  --task-definition khanflow-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=<target-group-arn>,containerName=backend,containerPort=8000"
```

## Option 3: AWS Amplify (Frontend Only)

Perfect for Next.js frontend deployment.

### Setup

1. **Push code to GitHub**

2. **In AWS Amplify Console:**
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select the `new-frontend` folder as root directory
   - Configure build settings (auto-detected for Next.js)

3. **Add Environment Variables:**
   - Add all `NEXT_PUBLIC_*` variables
   - Add `OPENAI_API_KEY` and other server-side vars

4. **Deploy:**
   - Amplify automatically deploys on push to main branch

## Environment Configuration

### AWS Secrets Manager

Store sensitive credentials:

```bash
# Create secret
aws secretsmanager create-secret \
  --name khanflow/production \
  --secret-string '{
    "DATABASE_URL": "postgresql://...",
    "JWT_SECRET": "your-secret",
    "GOOGLE_CLIENT_SECRET": "secret",
    "MS_CLIENT_SECRET": "secret",
    "OPENAI_API_KEY": "sk-..."
  }'

# Update secret
aws secretsmanager update-secret \
  --secret-id khanflow/production \
  --secret-string '{"key": "new-value"}'
```

### CloudWatch Logs

Configure logging:

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/khanflow-backend
aws logs create-log-group --log-group-name /ecs/khanflow-frontend

# View logs
aws logs tail /ecs/khanflow-backend --follow
```

## Security Configuration

### Security Groups

Backend security group:
- Allow inbound: Port 8000 from ALB security group
- Allow outbound: All traffic

Frontend security group:
- Allow inbound: Port 3000 from ALB security group
- Allow outbound: All traffic

ALB security group:
- Allow inbound: Port 80 (HTTP) and 443 (HTTPS) from 0.0.0.0/0
- Allow outbound: All traffic

### IAM Roles

Create ECS task execution role with policies:
- `AmazonECSTaskExecutionRolePolicy`
- Custom policy for Secrets Manager access
- Custom policy for CloudWatch Logs

## SSL/HTTPS Setup

### Using AWS Certificate Manager

```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS

# Add HTTPS listener to ALB
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

## Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/khanflow-cluster/khanflow-backend-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/khanflow-cluster/khanflow-backend-service \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Monitoring

### CloudWatch Alarms

```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name khanflow-backend-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Cost Optimization

1. **Use Fargate Spot** for non-critical workloads
2. **Right-size instances** based on actual usage
3. **Use CloudFront CDN** to reduce bandwidth costs
4. **Set up auto-scaling** to scale down during low traffic
5. **Use reserved instances** for predictable workloads

## Troubleshooting

### Check ECS Task Status
```bash
aws ecs describe-tasks --cluster khanflow-cluster --tasks <task-id>
```

### View Task Logs
```bash
aws logs tail /ecs/khanflow-backend --follow
```

### Update Service
```bash
aws ecs update-service \
  --cluster khanflow-cluster \
  --service khanflow-backend-service \
  --force-new-deployment
```

## CI/CD Integration

See `.github/workflows/` for GitHub Actions deployment pipelines.

## Next Steps

- Set up CloudFront for CDN
- Configure Route 53 for DNS
- Set up automated backups
- Implement monitoring with CloudWatch
- Configure AWS WAF for security
