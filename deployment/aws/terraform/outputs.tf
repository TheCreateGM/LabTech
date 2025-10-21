output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.cloudfront_domain_name
}

output "db_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.redis_endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = module.s3.bucket_name
}

output "ec2_instance_role_arn" {
  description = "EC2 instance IAM role ARN"
  value       = module.iam.ec2_instance_role_arn
}
