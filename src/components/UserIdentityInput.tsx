import React, { useState } from 'react';
import { Input } from './ui/Input';
import { toast } from 'sonner';

interface UserIdentityInputProps {
  onValueChange: (value: string, type: 'email' | 'id') => void;
  placeholder?: string;
  initialType?: 'email' | 'id';
  suggestions?: any[];
}

export const UserIdentityInput: React.FC<UserIdentityInputProps> = ({ 
  onValueChange, 
  placeholder,
  initialType = 'email',
  suggestions = []
}) => {
  const [type, setType] = useState<'email' | 'id'>(initialType);
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleChange = (val: string) => {
    setValue(val);
    onValueChange(val, type);
    setShowSuggestions(true);
  };

  const handleTypeChange = (newType: 'email' | 'id') => {
    setType(newType);
    setValue('');
    onValueChange('', newType);
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(s => {
    if (!value) return false;
    const searchVal = value.toLowerCase();
    if (type === 'email') {
      return s.email?.toLowerCase().includes(searchVal) || s.fullName?.toLowerCase().includes(searchVal);
    } else {
      return s.memberId?.toString().includes(searchVal) || s.fullName?.toLowerCase().includes(searchVal);
    }
  }).slice(0, 5);

  return (
    <div className="space-y-3 relative">
      <div className="flex p-1 bg-white/5 rounded-lg border border-white/10">
        <button 
          type="button"
          onClick={() => handleTypeChange('email')}
          className={`flex-1 py-1.5 text-[10px] font-cyber uppercase tracking-widest rounded-md transition-all ${type === 'email' ? 'bg-primary text-dark-navy' : 'text-muted-foreground hover:text-white'}`}
        >
          By Email
        </button>
        <button 
          type="button"
          onClick={() => handleTypeChange('id')}
          className={`flex-1 py-1.5 text-[10px] font-cyber uppercase tracking-widest rounded-md transition-all ${type === 'id' ? 'bg-primary text-dark-navy' : 'text-muted-foreground hover:text-white'}`}
        >
          By ID
        </button>
      </div>
      <div className="relative">
        <Input 
          placeholder={placeholder || (type === 'email' ? "operative@datacamp.com" : "Member ID (e.g. 123)")} 
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-dark-navy border border-white/10 rounded-lg shadow-xl overflow-hidden">
            {filteredSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                className="w-full px-4 py-2 text-left text-xs hover:bg-primary/10 transition-colors border-b border-white/5 last:border-0"
                onClick={() => {
                  const selectedVal = type === 'email' ? s.email : s.memberId;
                  setValue(selectedVal);
                  onValueChange(selectedVal, type);
                  setShowSuggestions(false);
                }}
              >
                <div className="font-bold">{s.fullName}</div>
                <div className="text-[10px] text-muted-foreground">
                  {type === 'email' ? s.email : `ID: ${s.memberId}`}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const validateUserIdentity = (value: string, type: 'email' | 'id'): boolean => {
  if (!value) {
    toast.error('Please identify the author');
    return false;
  }
  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      toast.error('Invalid email format');
      return false;
    }
  } else {
    if (!/^\d+$/.test(value)) {
      toast.error('ID must be numeric');
      return false;
    }
  }
  return true;
};
