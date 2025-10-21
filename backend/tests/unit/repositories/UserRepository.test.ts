import { UserRepository, User, CreateUserData, UpdateUserData } from '../../../src/repositories/UserRepository';

// Mock the BaseRepository
jest.mock('../../../src/repositories/BaseRepository');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = new UserRepository();
    mockQuery = jest.fn();
    (userRepository as any).query = mockQuery;
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const mockUser: User = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user',
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      mockQuery.mockResolvedValue([mockUser]);

      const result = await userRepository.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE username = $1'),
        ['testuser']
      );
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await userRepository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser: User = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user',
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      mockQuery.mockResolvedValue([mockUser]);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE email = $1'),
        ['test@example.com']
      );
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValue([]);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user with default values', async () => {
      const userData: CreateUserData = {
        username: 'newuser',
        email: 'new@example.com',
        password_hash: 'hashed-password',
      };

      const mockCreatedUser: User = {
        id: 'user-new',
        ...userData,
        role: 'user',
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      mockQuery.mockResolvedValue([mockCreatedUser]);

      const result = await userRepository.create(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['newuser', 'new@example.com', 'hashed-password', 'user', null, false])
      );
    });

    it('should create user with custom role and MFA settings', async () => {
      const userData: CreateUserData = {
        username: 'adminuser',
        email: 'admin@example.com',
        password_hash: 'hashed-password',
        role: 'admin',
        mfa_secret: 'mfa-secret',
        mfa_enabled: true,
      };

      const mockCreatedUser: User = {
        id: 'user-admin',
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      mockQuery.mockResolvedValue([mockCreatedUser]);

      const result = await userRepository.create(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        expect.arrayContaining(['adminuser', 'admin@example.com', 'hashed-password', 'admin', 'mfa-secret', true])
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const updateData: UpdateUserData = {
        email: 'updated@example.com',
        mfa_enabled: true,
      };

      const mockUpdatedUser: User = {
        id: 'user-123',
        username: 'testuser',
        email: 'updated@example.com',
        password_hash: 'hashed-password',
        role: 'user',
        mfa_secret: null,
        mfa_enabled: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      mockQuery.mockResolvedValue([mockUpdatedUser]);

      const result = await userRepository.update('user-123', updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.arrayContaining(['updated@example.com', true, 'user-123'])
      );
    });

    it('should return existing user if no updates provided', async () => {
      const mockUser: User = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        role: 'user',
        mfa_secret: null,
        mfa_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
      };

      (userRepository as any).findById = jest.fn().mockResolvedValue(mockUser);

      const result = await userRepository.update('user-123', {});

      expect(result).toEqual(mockUser);
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  describe('findByRole', () => {
    it('should find users by role', async () => {
      const mockUsers: User[] = [
        {
          id: 'admin-1',
          username: 'admin1',
          email: 'admin1@example.com',
          password_hash: 'hash',
          role: 'admin',
          mfa_secret: null,
          mfa_enabled: false,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: null,
        },
        {
          id: 'admin-2',
          username: 'admin2',
          email: 'admin2@example.com',
          password_hash: 'hash',
          role: 'admin',
          mfa_secret: null,
          mfa_enabled: false,
          created_at: new Date(),
          updated_at: new Date(),
          last_login: null,
        },
      ];

      mockQuery.mockResolvedValue(mockUsers);

      const result = await userRepository.findByRole('admin');

      expect(result).toEqual(mockUsers);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM users WHERE role = $1'),
        ['admin']
      );
    });
  });

  describe('usernameExists', () => {
    it('should return true if username exists', async () => {
      mockQuery.mockResolvedValue([{ exists: true }]);

      const result = await userRepository.usernameExists('existinguser');

      expect(result).toBe(true);
    });

    it('should return false if username does not exist', async () => {
      mockQuery.mockResolvedValue([{ exists: false }]);

      const result = await userRepository.usernameExists('newuser');

      expect(result).toBe(false);
    });
  });

  describe('emailExists', () => {
    it('should return true if email exists', async () => {
      mockQuery.mockResolvedValue([{ exists: true }]);

      const result = await userRepository.emailExists('existing@example.com');

      expect(result).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      mockQuery.mockResolvedValue([{ exists: false }]);

      const result = await userRepository.emailExists('new@example.com');

      expect(result).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockQuery.mockResolvedValue([]);

      await userRepository.updateLastLogin('user-123');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1'),
        ['user-123']
      );
    });
  });

  describe('countByRole', () => {
    it('should count users by role', async () => {
      (userRepository as any).count = jest.fn().mockResolvedValue(5);

      const result = await userRepository.countByRole('user');

      expect(result).toBe(5);
      expect((userRepository as any).count).toHaveBeenCalledWith('role = $1', ['user']);
    });
  });
});
