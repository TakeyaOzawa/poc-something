import { XPath, XPathData } from '../XPath';

describe('XPath', () => {
  const validXPathData: XPathData = {
    id: 'xpath-1',
    websiteId: 'website-1',
    value: 'test value',
    actionType: 'input',
    url: 'https://example.com',
    executionOrder: 1
  };

  it('should create an XPath with valid data', () => {
    const xpath = XPath.create(validXPathData);
    
    expect(xpath.getId()).toBe('xpath-1');
    expect(xpath.getWebsiteId()).toBe('website-1');
    expect(xpath.getValue()).toBe('test value');
    expect(xpath.getActionType()).toBe('input');
    expect(xpath.getUrl()).toBe('https://example.com');
    expect(xpath.getExecutionOrder()).toBe(1);
  });

  it('should return correct data when calling toData', () => {
    const xpath = XPath.create(validXPathData);
    const data = xpath.toData();
    
    expect(data).toEqual(validXPathData);
  });
});
