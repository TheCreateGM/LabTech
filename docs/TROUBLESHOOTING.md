# Troubleshooting Guide

Common issues and solutions for the LabTech GeoLab User Tracking System.

## Table of Contents

- [Application Issues](#application-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)
- [Network Issues](#network-issues)

## Application Issues

### Application Won't Start

**Symptoms**:
- Application exits immediately
- "Cannot find module" errors
- Port already in use

**Solutions**:

1. **Check environment variables**:
   ```bash
   npm run validate:env
   ```

2. **Verify dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check port availability**:
   ```bash
   # Linux/Mac
   lsof -i :3000
   
   # Kill process using port
   kill -9 <PID>
   ```

4. **Check logs**:
   ```bash
   tail -f logs/app.log
   ```

### High Memory Usage

**Symptoms**:
- Application crashes with OOM errors
- Slow response times
- Memory usage > 1GB

**Solutions**:

1. **Check for memory leaks**:
   ```bash
   node --inspect dist/index.js
   # Open chrome://inspect in Chrome
   ```

2. **Increase Node.js memory limit**:
   ```bash
   NODE_OPTIONS="--max-old-space-size=2048" npm start
   ```

3. **Optimize database queries**:
   - Add indexes
   - Use pagination
   - Limit result sets

4. **Enable garbage collection logging**:
   ```bash
   NODE_OPTIONS="--trace-gc" npm start
   ```

### Application Crashes Randomly

**Symptoms**:
- Unexpected exits
- No error messages
- Process restarts

**Solutions**:

1. **Check for unhandled rejections**:
   ```typescript
   process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection:', reason);
   });
   ```

2. **Enable PM2 for auto-restart**:
   ```bash
   pm2 start dist/index.js --name labtech-api
   pm2 logs
   ```

3. **Check system resources**:
   ```bash
   free -h  # Memory
   df -h    # Disk space
   top      # CPU usage
   ```

## Database Issues

### Cannot Connect to Database

**Symptoms**:
- `ECONNREFUSED` errors
- `Connection timeout` errors
- Application won't start

**Solutions**:

1. **Verify DATABASE_URL**:
   ```bash
   echo $DATABASE_URL
   ```

2. **Test connection**:
   ```bash
   psql $DATABASE_URL
   ```

3. **Check PostgreSQL status**:
   ```bash
   # Linux
   sudo systemctl status postgresql
   
   # Docker
   docker-compose ps postgres
   ```

4. **Verify network connectivity**:
   ```bash
   telnet db-host 5432
   ```

5. **Check firewall rules**:
   ```bash
   sudo ufw status
   ```

### Slow Database Queries

**Symptoms**:
- API response times > 1 second
- High database CPU usage
- Query timeouts

**Solutions**:

1. **Identify slow queries**:
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Add missing indexes**:
   ```sql
   -- Check missing indexes
   SELECT schemaname, tablename, attname
   FROM pg_stats
   WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
   AND n_distinct > 100
   AND correlation < 0.1;
   ```

3. **Analyze query plans**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM activity_logs WHERE user_id = '...';
   ```

4. **Optimize connection pool**:
   ```bash
   DATABASE_POOL_MIN=10
   DATABASE_POOL_MAX=50
   ```

### Database Connection Pool Exhausted

**Symptoms**:
- "Too many connections" errors
- Application hangs
- Timeouts

**Solutions**:

1. **Increase max connections**:
   ```sql
   ALTER SYSTEM SET max_connections = 200;
   SELECT pg_reload_conf();
   ```

2. **Optimize pool settings**:
   ```bash
   DATABASE_POOL_MAX=50
   DATABASE_IDLE_TIMEOUT=30000
   ```

3. **Find connection leaks**:
   ```sql
   SELECT pid, usename, application_name, state, query
   FROM pg_stat_activity
   WHERE state != 'idle';
   ```

4. **Kill idle connections**:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < NOW() - INTERVAL '10 minutes';
   ```

### Migration Failures

**Symptoms**:
- Migration errors
- Schema mismatch
- Data corruption

**Solutions**:

1. **Check migration status**:
   ```bash
   npm run migrate:status
   ```

2. **Rollback last migration**:
   ```bash
   npm run migrate:down
   ```

3. **Fix and re-run**:
   ```bash
   npm run migrate:up
   ```

4. **Reset database** (development only):
   ```bash
   npm run db:reset
   npm run migrate
   ```

## Authentication Issues

### JWT Token Invalid

**Symptoms**:
- 401 Unauthorized errors
- "Invalid token" messages
- Users logged out unexpectedly

**Solutions**:

1. **Verify JWT secret**:
   ```bash
   echo $JWT_SECRET
   ```

2. **Check token expiry**:
   ```typescript
   const decoded = jwt.decode(token);
   console.log('Expires:', new Date(decoded.exp * 1000));
   ```

3. **Verify RSA keys match**:
   ```bash
   # Extract public key from private key
   openssl rsa -in private.pem -pubout
   
   # Compare with stored public key
   cat public.pem
   ```

4. **Clear token blacklist**:
   ```bash
   redis-cli -a $REDIS_PASSWORD FLUSHDB
   ```

### MFA Verification Fails

**Symptoms**:
- "Invalid MFA token" errors
- QR code doesn't work
- Backup codes rejected

**Solutions**:

1. **Check time synchronization**:
   ```bash
   # Server time must be accurate
   timedatectl status
   
   # Sync time
   sudo ntpdate -s time.nist.gov
   ```

2. **Verify MFA secret**:
   ```sql
   SELECT mfa_secret, mfa_enabled FROM users WHERE id = '...';
   ```

3. **Test TOTP generation**:
   ```bash
   npm run test:mfa
   ```

4. **Regenerate MFA secret**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
     -H "Authorization: Bearer $TOKEN"
   ```

### Session Expired Too Quickly

**Symptoms**:
- Users logged out after < 15 minutes
- Frequent re-authentication required

**Solutions**:

1. **Check token expiry settings**:
   ```bash
   echo $JWT_ACCESS_EXPIRY
   echo $JWT_REFRESH_EXPIRY
   ```

2. **Implement token refresh**:
   ```typescript
   // Frontend: Refresh token before expiry
   setInterval(async () => {
     await refreshAccessToken();
   }, 14 * 60 * 1000); // 14 minutes
   ```

3. **Verify Redis session storage**:
   ```bash
   redis-cli -a $REDIS_PASSWORD
   > KEYS session:*
   > TTL session:abc123
   ```

## Performance Issues

### Slow API Response Times

**Symptoms**:
- Response times > 500ms
- Timeouts
- Poor user experience

**Solutions**:

1. **Enable request logging**:
   ```bash
   LOG_LEVEL=debug npm start
   ```

2. **Profile slow endpoints**:
   ```bash
   # Install clinic.js
   npm install -g clinic
   
   # Profile application
   clinic doctor -- node dist/index.js
   ```

3. **Add caching**:
   ```typescript
   // Cache activity stats for 5 minutes
   const stats = await redis.get('stats:cache');
   if (!stats) {
     const data = await getActivityStats();
     await redis.setex('stats:cache', 300, JSON.stringify(data));
   }
   ```

4. **Optimize database queries**:
   - Add indexes
   - Use query result caching
   - Implement pagination

### High CPU Usage

**Symptoms**:
- CPU usage > 80%
- Slow response times
- Server overload

**Solutions**:

1. **Identify CPU-intensive operations**:
   ```bash
   node --prof dist/index.js
   node --prof-process isolate-*.log > processed.txt
   ```

2. **Optimize algorithms**:
   - Use efficient data structures
   - Avoid nested loops
   - Implement caching

3. **Scale horizontally**:
   ```bash
   # Add more instances
   pm2 scale labtech-api +2
   ```

4. **Use worker threads**:
   ```typescript
   import { Worker } from 'worker_threads';
   
   const worker = new Worker('./heavy-task.js');
   ```

### Memory Leaks

**Symptoms**:
- Memory usage increases over time
- Application crashes after hours/days
- OOM errors

**Solutions**:

1. **Take heap snapshots**:
   ```bash
   node --inspect dist/index.js
   # Use Chrome DevTools Memory profiler
   ```

2. **Check for common leaks**:
   - Unclosed database connections
   - Event listener leaks
   - Global variable accumulation
   - Circular references

3. **Use memory profiling tools**:
   ```bash
   npm install -g memwatch-next
   ```

4. **Implement proper cleanup**:
   ```typescript
   process.on('SIGTERM', async () => {
     await db.close();
     await redis.quit();
     server.close();
   });
   ```

## Deployment Issues

### Docker Container Won't Start

**Symptoms**:
- Container exits immediately
- "Error response from daemon"
- Health check failures

**Solutions**:

1. **Check container logs**:
   ```bash
   docker logs labtech-backend
   docker logs --tail=100 labtech-backend
   ```

2. **Inspect container**:
   ```bash
   docker inspect labtech-backend
   ```

3. **Test image locally**:
   ```bash
   docker run -it --rm labtech-backend sh
   ```

4. **Verify environment variables**:
   ```bash
   docker exec labtech-backend env
   ```

### Heroku Build Failures

**Symptoms**:
- Build fails during deployment
- "Failed to compile" errors
- Missing dependencies

**Solutions**:

1. **Check build logs**:
   ```bash
   heroku logs --tail --app labtech-geolab
   ```

2. **Clear build cache**:
   ```bash
   heroku plugins:install heroku-builds
   heroku builds:cache:purge
   ```

3. **Verify Procfile**:
   ```bash
   cat Procfile
   ```

4. **Test build locally**:
   ```bash
   heroku local web
   ```

### AWS Deployment Issues

**Symptoms**:
- Terraform errors
- EC2 instances not starting
- Load balancer health checks failing

**Solutions**:

1. **Check Terraform state**:
   ```bash
   terraform show
   terraform state list
   ```

2. **Verify security groups**:
   ```bash
   aws ec2 describe-security-groups --group-ids sg-xxx
   ```

3. **Check EC2 logs**:
   ```bash
   ssh ec2-user@instance-ip
   sudo journalctl -u labtech-api -f
   ```

4. **Test load balancer**:
   ```bash
   curl http://alb-dns-name/api/v1/health
   ```

## Network Issues

### CORS Errors

**Symptoms**:
- "Access-Control-Allow-Origin" errors
- Preflight request failures
- 403 Forbidden

**Solutions**:

1. **Verify CORS_ORIGIN**:
   ```bash
   echo $CORS_ORIGIN
   ```

2. **Check CORS middleware**:
   ```typescript
   app.use(cors({
     origin: process.env.CORS_ORIGIN.split(','),
     credentials: true
   }));
   ```

3. **Test CORS**:
   ```bash
   curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:3000/api/v1/activities
   ```

### WebSocket Connection Failures

**Symptoms**:
- "WebSocket connection failed"
- Real-time updates not working
- Connection timeouts

**Solutions**:

1. **Check WebSocket server**:
   ```bash
   curl -i -N \
     -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     http://localhost:3000/socket.io/
   ```

2. **Verify proxy configuration**:
   ```nginx
   location /socket.io/ {
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```

3. **Check firewall rules**:
   ```bash
   sudo ufw allow 3000/tcp
   ```

### SSL Certificate Errors

**Symptoms**:
- "Certificate verification failed"
- "NET::ERR_CERT_AUTHORITY_INVALID"
- HTTPS not working

**Solutions**:

1. **Verify certificate**:
   ```bash
   openssl x509 -in cert.pem -text -noout
   ```

2. **Check certificate chain**:
   ```bash
   openssl s_client -connect your-domain.com:443 -showcerts
   ```

3. **Renew Let's Encrypt certificate**:
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

4. **Test SSL configuration**:
   ```bash
   curl -vI https://your-domain.com
   ```

## Getting Help

If you can't resolve your issue:

1. **Check logs**:
   - Application logs: `logs/app.log`
   - System logs: `/var/log/syslog`
   - Docker logs: `docker-compose logs`

2. **Enable debug mode**:
   ```bash
   LOG_LEVEL=debug npm start
   ```

3. **Search existing issues**:
   - GitHub: [github.com/your-org/labtech-geolab/issues](https://github.com/your-org/labtech-geolab/issues)

4. **Create a new issue**:
   - Include error messages
   - Provide steps to reproduce
   - Share relevant logs
   - Specify environment (OS, Node version, etc.)

5. **Contact support**:
   - Email: support@labtech-geolab.com
   - Slack: #labtech-support

## Diagnostic Commands

Quick reference for diagnostic commands:

```bash
# Application
npm run validate:env          # Validate environment variables
npm run db:test              # Test database connection
npm run health               # Check application health

# Database
psql $DATABASE_URL           # Connect to database
npm run migrate:status       # Check migration status
npm run db:backup            # Create database backup

# Redis
redis-cli -a $REDIS_PASSWORD ping  # Test Redis connection
redis-cli -a $REDIS_PASSWORD info  # Redis info

# Docker
docker-compose ps            # Container status
docker-compose logs -f       # View logs
docker stats                 # Resource usage

# System
free -h                      # Memory usage
df -h                        # Disk usage
top                          # CPU usage
netstat -tulpn              # Network connections
```

## Additional Resources

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Troubleshooting](https://docs.docker.com/config/daemon/)
- [Nginx Troubleshooting](https://nginx.org/en/docs/debugging_log.html)
