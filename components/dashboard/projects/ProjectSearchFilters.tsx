'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { CalendarIcon, Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface SearchFilters {
  searchTerm: string;
  priority: string[];
  tags: string[];
  dueDateFrom: Date | null;
  dueDateTo: Date | null;
  status: string[];
  category: string | null;
  startDateFrom: Date | null;
  startDateTo: Date | null;
  completionDateFrom: Date | null;
  completionDateTo: Date | null;
}

interface ProjectSearchFiltersProps {
  onFilterChange: (filters: SearchFilters) => void;
  availableTags: string[];
  availableCategories?: string[];
}

export default function ProjectSearchFilters({ 
  onFilterChange, 
  availableTags, 
  availableCategories = [] 
}: ProjectSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dueDateFrom, setDueDateFrom] = useState<Date | null>(null);
  const [dueDateTo, setDueDateTo] = useState<Date | null>(null);
  const [startDateFrom, setStartDateFrom] = useState<Date | null>(null);
  const [startDateTo, setStartDateTo] = useState<Date | null>(null);
  const [completionDateFrom, setCompletionDateFrom] = useState<Date | null>(null);
  const [completionDateTo, setCompletionDateTo] = useState<Date | null>(null);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Handler functions for calendar date selection
  const handleFromDateSelect = (date: Date | undefined) => {
    setDueDateFrom(date || null);
  };

  const handleToDateSelect = (date: Date | undefined) => {
    setDueDateTo(date || null);
  };

  const handleStartDateFromSelect = (date: Date | undefined) => {
    setStartDateFrom(date || null);
  };

  const handleStartDateToSelect = (date: Date | undefined) => {
    setStartDateTo(date || null);
  };

  const handleCompletionDateFromSelect = (date: Date | undefined) => {
    setCompletionDateFrom(date || null);
  };

  const handleCompletionDateToSelect = (date: Date | undefined) => {
    setCompletionDateTo(date || null);
  };

  // Priority options
  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  // Status options
  const statusOptions = [
    { value: 'not_started', label: 'Not Started' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  // Update active filter count
  useEffect(() => {
    let count = 0;
    if (selectedPriorities.length > 0) count++;
    if (selectedTags.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedCategory) count++;
    if (dueDateFrom || dueDateTo) count++;
    if (startDateFrom || startDateTo) count++;
    if (completionDateFrom || completionDateTo) count++;
    setActiveFilterCount(count);
  }, [
    selectedPriorities, 
    selectedTags, 
    selectedStatuses,
    selectedCategory,
    dueDateFrom, 
    dueDateTo,
    startDateFrom,
    startDateTo,
    completionDateFrom,
    completionDateTo
  ]);

  // Apply filters
  useEffect(() => {
    const filters: SearchFilters = {
      searchTerm,
      priority: selectedPriorities,
      tags: selectedTags,
      status: selectedStatuses,
      category: selectedCategory,
      dueDateFrom,
      dueDateTo,
      startDateFrom,
      startDateTo,
      completionDateFrom,
      completionDateTo,
    };
    onFilterChange(filters);
  }, [
    searchTerm, 
    selectedPriorities, 
    selectedTags, 
    selectedStatuses,
    selectedCategory,
    dueDateFrom, 
    dueDateTo,
    startDateFrom,
    startDateTo,
    completionDateFrom,
    completionDateTo,
    onFilterChange
  ]);

  // Handle priority toggle
  const handlePriorityToggle = (priority: string) => {
    setSelectedPriorities(prev => 
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  // Handle status toggle
  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPriorities([]);
    setSelectedTags([]);
    setSelectedStatuses([]);
    setSelectedCategory(null);
    setDueDateFrom(null);
    setDueDateTo(null);
    setStartDateFrom(null);
    setStartDateTo(null);
    setCompletionDateFrom(null);
    setCompletionDateTo(null);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search projects..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 ml-1" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-1" />
          )}
        </Button>
        {(activeFilterCount > 0 || searchTerm) && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/50">
            {/* Priority Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <div className="space-y-1.5">
                {priorityOptions.map((priority) => (
                  <div key={priority.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`priority-${priority.value}`}
                      checked={selectedPriorities.includes(priority.value)}
                      onCheckedChange={() => handlePriorityToggle(priority.value)}
                    />
                    <label
                      htmlFor={`priority-${priority.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {priority.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <div className="space-y-1.5">
                {statusOptions.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={selectedStatuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {status.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={selectedCategory || ""}
                onValueChange={(value) => setSelectedCategory(value === "" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="p-4 border rounded-md bg-muted/50">
            <Label className="text-sm font-medium">Tags</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {availableTags.length > 0 ? (
                availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => handleTagToggle(tag)}
                    />
                    <label
                      htmlFor={`tag-${tag}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {tag}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No tags available</p>
              )}
            </div>
          </div>

          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/50">
            {/* Due Date Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Due Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDateFrom ? format(dueDateFrom, "PPP") : <span>From</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDateFrom || undefined}
                        onSelect={handleFromDateSelect}
                        initialFocus
                        required={false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDateTo ? format(dueDateTo, "PPP") : <span>To</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDateTo || undefined}
                        onSelect={handleToDateSelect}
                        initialFocus
                        required={false}
                        disabled={(date) => dueDateFrom ? date < dueDateFrom : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDateFrom ? format(startDateFrom, "PPP") : <span>From</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateFrom || undefined}
                        onSelect={handleStartDateFromSelect}
                        initialFocus
                        required={false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDateTo ? format(startDateTo, "PPP") : <span>To</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateTo || undefined}
                        onSelect={handleStartDateToSelect}
                        initialFocus
                        required={false}
                        disabled={(date) => startDateFrom ? date < startDateFrom : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Completion Date Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Completion Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !completionDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {completionDateFrom ? format(completionDateFrom, "PPP") : <span>From</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={completionDateFrom || undefined}
                        onSelect={handleCompletionDateFromSelect}
                        initialFocus
                        required={false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !completionDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {completionDateTo ? format(completionDateTo, "PPP") : <span>To</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={completionDateTo || undefined}
                        onSelect={handleCompletionDateToSelect}
                        initialFocus
                        required={false}
                        disabled={(date) => completionDateFrom ? date < completionDateFrom : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
