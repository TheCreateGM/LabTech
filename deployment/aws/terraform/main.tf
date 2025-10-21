terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "labtech-terraform-state"
    key            = "labtech-geolab/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "labtech-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "LabTech GeoLab"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security_groups"

  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# RDS Module
module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  db_security_group_id    = module.security_groups.db_security_group_id
  db_instance_class       = var.db_instance_class
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password
  multi_az                = var.db_multi_az
  backup_retention_period = var.db_backup_retention_period
}

# ElastiCache Module
module "elasticache" {
  source = "./modules/elasticache"

  environment               = var.environment
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  redis_security_group_id   = module.security_groups.redis_security_group_id
  redis_node_type           = var.redis_node_type
  redis_num_cache_nodes     = var.redis_num_cache_nodes
}

# EC2 Module
module "ec2" {
  source = "./modules/ec2"

  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  public_subnet_ids        = module.vpc.public_subnet_ids
  private_subnet_ids       = module.vpc.private_subnet_ids
  app_security_group_id    = module.security_groups.app_security_group_id
  instance_type            = var.instance_type
  key_name                 = var.key_name
  min_size                 = var.asg_min_size
  max_size                 = var.asg_max_size
  desired_capacity         = var.asg_desired_capacity
  db_endpoint              = module.rds.db_endpoint
  redis_endpoint           = module.elasticache.redis_endpoint
  alb_target_group_arn     = module.alb.target_group_arn
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_groups.alb_security_group_id
  certificate_arn       = var.certificate_arn
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  environment = var.environment
  bucket_name = var.s3_bucket_name
}

# CloudFront Module
module "cloudfront" {
  source = "./modules/cloudfront"

  environment     = var.environment
  s3_bucket_id    = module.s3.bucket_id
  s3_bucket_arn   = module.s3.bucket_arn
  alb_dns_name    = module.alb.alb_dns_name
  certificate_arn = var.certificate_arn
  domain_name     = var.domain_name
}

# CloudWatch Module
module "cloudwatch" {
  source = "./modules/cloudwatch"

  environment          = var.environment
  alb_arn_suffix       = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix
  asg_name             = module.ec2.asg_name
  db_instance_id       = module.rds.db_instance_id
  redis_cluster_id     = module.elasticache.redis_cluster_id
  sns_email            = var.alert_email
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  environment    = var.environment
  s3_bucket_arn  = module.s3.bucket_arn
}
