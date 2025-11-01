import { Website, WebsiteData } from '../Website';

describe('Website', () => {
  const validWebsiteData: WebsiteData = {
    id: 'test-id',
    name: 'Test Website',
    startUrl: 'https://example.com',
    status: 'enabled'
  };

  it('should create a website with valid data', () => {
    const website = Website.create(validWebsiteData);
    
    expect(website.getId()).toBe('test-id');
    expect(website.getName()).toBe('Test Website');
    expect(website.getStartUrl()).toBe('https://example.com');
    expect(website.getStatus()).toBe('enabled');
    expect(website.isEnabled()).toBe(true);
  });

  it('should return correct data when calling toData', () => {
    const website = Website.create(validWebsiteData);
    const data = website.toData();
    
    expect(data).toEqual(validWebsiteData);
  });

  it('should return false for isEnabled when status is disabled', () => {
    const disabledWebsiteData = { ...validWebsiteData, status: 'disabled' as const };
    const website = Website.create(disabledWebsiteData);
    
    expect(website.isEnabled()).toBe(false);
  });
});
