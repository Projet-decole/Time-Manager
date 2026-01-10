// backend/tests/utils/transformers.test.js

const { snakeToCamel, camelToSnake } = require('../../utils/transformers');

describe('transformers', () => {
  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      const input = { user_id: 1, created_at: '2026-01-10' };
      const expected = { userId: 1, createdAt: '2026-01-10' };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
      const input = { user: { first_name: 'John', last_name: 'Doe' } };
      const expected = { user: { firstName: 'John', lastName: 'Doe' } };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle arrays of objects', () => {
      const input = [{ user_id: 1 }, { user_id: 2 }];
      const expected = [{ userId: 1 }, { userId: 2 }];

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle deeply nested objects', () => {
      const input = {
        user_data: {
          profile_info: {
            first_name: 'John',
            contact_details: {
              phone_number: '123456'
            }
          }
        }
      };
      const expected = {
        userData: {
          profileInfo: {
            firstName: 'John',
            contactDetails: {
              phoneNumber: '123456'
            }
          }
        }
      };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle arrays with nested objects', () => {
      const input = [
        { user_id: 1, user_details: { full_name: 'John' } },
        { user_id: 2, user_details: { full_name: 'Jane' } }
      ];
      const expected = [
        { userId: 1, userDetails: { fullName: 'John' } },
        { userId: 2, userDetails: { fullName: 'Jane' } }
      ];

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle null', () => {
      expect(snakeToCamel(null)).toBeNull();
    });

    it('should handle undefined', () => {
      expect(snakeToCamel(undefined)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(snakeToCamel('string')).toBe('string');
      expect(snakeToCamel(123)).toBe(123);
      expect(snakeToCamel(true)).toBe(true);
    });

    it('should handle empty object', () => {
      expect(snakeToCamel({})).toEqual({});
    });

    it('should handle empty array', () => {
      expect(snakeToCamel([])).toEqual([]);
    });

    it('should not modify already camelCase keys', () => {
      const input = { userId: 1, userName: 'John' };
      const expected = { userId: 1, userName: 'John' };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle keys with multiple underscores', () => {
      const input = { user_first_name_value: 'John' };
      const expected = { userFirstNameValue: 'John' };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should preserve Date objects', () => {
      const testDate = new Date('2026-01-10');
      const input = { created_at: testDate, user_name: 'test' };
      const result = snakeToCamel(input);

      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.createdAt.toISOString()).toBe(testDate.toISOString());
      expect(result.userName).toBe('test');
    });

    it('should preserve RegExp objects', () => {
      const testRegex = /test/gi;
      const input = { validation_pattern: testRegex };
      const result = snakeToCamel(input);

      expect(result.validationPattern).toBeInstanceOf(RegExp);
      expect(result.validationPattern.source).toBe('test');
    });

    it('should preserve nested Date objects', () => {
      const testDate = new Date('2026-01-10');
      const input = {
        user_data: {
          created_at: testDate,
          updated_at: testDate
        }
      };
      const result = snakeToCamel(input);

      expect(result.userData.createdAt).toBeInstanceOf(Date);
      expect(result.userData.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('camelToSnake', () => {
    it('should convert camelCase to snake_case', () => {
      const input = { userId: 1, createdAt: '2026-01-10' };
      const expected = { user_id: 1, created_at: '2026-01-10' };

      expect(camelToSnake(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
      const input = { user: { firstName: 'John', lastName: 'Doe' } };
      const expected = { user: { first_name: 'John', last_name: 'Doe' } };

      expect(camelToSnake(input)).toEqual(expected);
    });

    it('should handle arrays of objects', () => {
      const input = [{ userId: 1 }, { userId: 2 }];
      const expected = [{ user_id: 1 }, { user_id: 2 }];

      expect(camelToSnake(input)).toEqual(expected);
    });

    it('should handle deeply nested objects', () => {
      const input = {
        userData: {
          profileInfo: {
            firstName: 'John',
            contactDetails: {
              phoneNumber: '123456'
            }
          }
        }
      };
      const expected = {
        user_data: {
          profile_info: {
            first_name: 'John',
            contact_details: {
              phone_number: '123456'
            }
          }
        }
      };

      expect(camelToSnake(input)).toEqual(expected);
    });

    it('should handle arrays with nested objects', () => {
      const input = [
        { userId: 1, userDetails: { fullName: 'John' } },
        { userId: 2, userDetails: { fullName: 'Jane' } }
      ];
      const expected = [
        { user_id: 1, user_details: { full_name: 'John' } },
        { user_id: 2, user_details: { full_name: 'Jane' } }
      ];

      expect(camelToSnake(input)).toEqual(expected);
    });

    it('should handle null', () => {
      expect(camelToSnake(null)).toBeNull();
    });

    it('should handle undefined', () => {
      expect(camelToSnake(undefined)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(camelToSnake('string')).toBe('string');
      expect(camelToSnake(123)).toBe(123);
      expect(camelToSnake(true)).toBe(true);
    });

    it('should handle empty object', () => {
      expect(camelToSnake({})).toEqual({});
    });

    it('should handle empty array', () => {
      expect(camelToSnake([])).toEqual([]);
    });

    it('should not modify already snake_case keys', () => {
      const input = { user_id: 1, user_name: 'John' };
      const expected = { user_id: 1, user_name: 'John' };

      expect(camelToSnake(input)).toEqual(expected);
    });

    it('should handle keys with multiple capital letters', () => {
      const input = { userFirstNameValue: 'John' };
      const expected = { user_first_name_value: 'John' };

      expect(camelToSnake(input)).toEqual(expected);
    });

    it('should handle all-uppercase keys (acronyms)', () => {
      expect(camelToSnake({ ID: 1 })).toEqual({ id: 1 });
      expect(camelToSnake({ URL: 'test' })).toEqual({ url: 'test' });
      expect(camelToSnake({ UUID: 'abc-123' })).toEqual({ uuid: 'abc-123' });
    });

    it('should handle acronyms followed by words', () => {
      expect(camelToSnake({ URLPath: '/' })).toEqual({ url_path: '/' });
      expect(camelToSnake({ HTMLParser: 'test' })).toEqual({ html_parser: 'test' });
      expect(camelToSnake({ XMLHttpRequest: 'test' })).toEqual({ xml_http_request: 'test' });
    });

    it('should handle acronyms at the end', () => {
      expect(camelToSnake({ apiURL: '/' })).toEqual({ api_url: '/' });
      expect(camelToSnake({ userID: 1 })).toEqual({ user_id: 1 });
    });

    it('should preserve Date objects', () => {
      const testDate = new Date('2026-01-10');
      const input = { createdAt: testDate, userName: 'test' };
      const result = camelToSnake(input);

      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.created_at.toISOString()).toBe(testDate.toISOString());
      expect(result.user_name).toBe('test');
    });

    it('should preserve RegExp objects', () => {
      const testRegex = /test/gi;
      const input = { validationPattern: testRegex };
      const result = camelToSnake(input);

      expect(result.validation_pattern).toBeInstanceOf(RegExp);
      expect(result.validation_pattern.source).toBe('test');
    });
  });

  describe('round-trip conversion', () => {
    it('should round-trip from snake_case to camelCase and back', () => {
      const original = { user_id: 1, created_at: '2026-01-10', is_active: true };
      const camelCased = snakeToCamel(original);
      const backToSnake = camelToSnake(camelCased);

      expect(backToSnake).toEqual(original);
    });

    it('should round-trip from camelCase to snake_case and back', () => {
      const original = { userId: 1, createdAt: '2026-01-10', isActive: true };
      const snakeCased = camelToSnake(original);
      const backToCamel = snakeToCamel(snakeCased);

      expect(backToCamel).toEqual(original);
    });

    it('should round-trip complex nested structures', () => {
      const original = {
        user_id: 1,
        user_data: {
          first_name: 'John',
          last_name: 'Doe',
          contact_info: {
            email_address: 'john@example.com',
            phone_numbers: [
              { phone_type: 'mobile', phone_value: '123' },
              { phone_type: 'home', phone_value: '456' }
            ]
          }
        }
      };

      const camelCased = snakeToCamel(original);
      const backToSnake = camelToSnake(camelCased);

      expect(backToSnake).toEqual(original);
    });

    it('should preserve Date objects through round-trip', () => {
      const testDate = new Date('2026-01-10');
      const original = { created_at: testDate };

      const camelCased = snakeToCamel(original);
      expect(camelCased.createdAt).toBeInstanceOf(Date);

      const backToSnake = camelToSnake(camelCased);
      expect(backToSnake.created_at).toBeInstanceOf(Date);
      expect(backToSnake.created_at.toISOString()).toBe(testDate.toISOString());
    });
  });
});
